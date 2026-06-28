const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// Helper to generate time slots based on start/end time and duration
function generateTimeSlots(startTime, endTime, slotDuration) {
  const slots = [];
  const start = new Date(`1970-01-01T${startTime}:00Z`);
  const end = new Date(`1970-01-01T${endTime}:00Z`);
  
  while (start < end) {
    const hours = String(start.getUTCHours()).padStart(2, '0');
    const minutes = String(start.getUTCMinutes()).padStart(2, '0');
    slots.push(`${hours}:${minutes}`);
    start.setUTCMinutes(start.getUTCMinutes() + slotDuration);
  }
  return slots;
}

// @desc    Get available slots for a specific doctor and date
// @route   GET /api/appointments/doctors/:id/available-slots?date=YYYY-MM-DD
// @access  Private (Patient/Admin)
exports.getAvailableSlots = async (req, res) => {
  try {
    const { id: doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter is required (YYYY-MM-DD)." });
    }

    const today = new Date();
    const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const [year, month, dayStr] = date.split('-');
    const targetMidnight = new Date(parseInt(year), parseInt(month) - 1, parseInt(dayStr));

    if (targetMidnight < midnightToday) {
      return res.json({ availableSlots: [] });
    }

    const doctor = await Doctor.findOne({ id: doctorId }).lean();
    if (!doctor) return res.status(404).json({ error: "Doctor not found." });

    // Find the configuration specifically for this date
    const dayConfig = doctor.availability?.find(a => a.date === date);
    if (!dayConfig || !dayConfig.slots || dayConfig.slots.length === 0) {
      return res.json({ availableSlots: [] }); // Doctor is not available on this date
    }

    // Generate all possible slots for the day by iterating through each slot block
    let allSlots = [];
    for (const slotBlock of dayConfig.slots) {
      const slotDur = parseInt(slotBlock.duration) || 30;
      allSlots = allSlots.concat(generateTimeSlots(slotBlock.startTime, slotBlock.endTime, slotDur));
    }

    // Fetch existing booked appointments for the doctor on this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date,
      status: { $ne: 'cancelled' }
    }).select('timeSlot').lean();

    const bookedSlotsSet = new Set(bookedAppointments.map(a => a.timeSlot));

    // Filter out booked slots and past slots (if date is today)
    const availableSlots = allSlots.filter(slot => {
      if (bookedSlotsSet.has(slot)) return false;
      if (targetMidnight.getTime() === midnightToday.getTime()) {
        const [hours, minutes] = slot.split(':');
        const slotDateTime = new Date(targetMidnight.getFullYear(), targetMidnight.getMonth(), targetMidnight.getDate(), parseInt(hours, 10), parseInt(minutes, 10));
        if (slotDateTime < today) return false;
      }
      return true;
    });

    return res.json({ availableSlots });
  } catch (error) {
    console.error("[GET /available-slots] Error:", error.message);
    return res.status(500).json({ error: "Failed to fetch available slots." });
  }
};

// @desc    Book a new appointment
// @route   POST /api/appointments/book
// @access  Private (Patient)
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot } = req.body;
    
    // Validate role
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: "Only patients can book appointments." });
    }
    const patientId = req.user.referenceId; // Use the logged in patient's ID

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required fields: doctorId, date, timeSlot." });
    }

    const [year, month, d] = date.split('-');
    const [hours, minutes] = timeSlot.split(':');
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(d), parseInt(hours, 10), parseInt(minutes, 10));
    const today = new Date();
    
    // Check if the entire date is before today (midnight)
    const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    if (targetMidnight < midnightToday) {
      return res.status(400).json({ message: "Cannot book an appointment for a past date." });
    }
    
    // If it's today, check if the time has passed
    if (targetMidnight.getTime() === midnightToday.getTime() && targetDate < today) {
      return res.status(400).json({ message: "Validation failure. Selected time slot has already passed." });
    }

    // Business Rule: Patient can only book 1 slot per day
    const existingAppointment = await Appointment.findOne({ patientId, date });
    if (existingAppointment) {
      // Overwrite / Reschedule scenario
      existingAppointment.doctorId = doctorId;
      existingAppointment.timeSlot = timeSlot;
      existingAppointment.status = 'booked';
      await existingAppointment.save();
      
      const io = req.app.get('io');
      if (io) {
        io.to(doctorId).emit('newAppointment', {
          date: existingAppointment.date,
          timeSlot: existingAppointment.timeSlot,
          patient: { id: req.user.referenceId, name: req.user.name }
        });
      }
      
      return res.status(200).json({ message: "Appointment successfully rescheduled.", appointment: existingAppointment });
    }

    const appointmentId = `APT-${Math.round(Math.random() * 1000000)}`;

    const appointment = await Appointment.create({
      appointmentId,
      date,
      timeSlot,
      doctorId,
      patientId,
      status: 'booked'
    });

    const io = req.app.get('io');
    if (io) {
      io.to(doctorId).emit('newAppointment', {
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        patient: { id: req.user.referenceId, name: req.user.name }
      });
    }

    return res.status(201).json({ message: "Appointment successfully booked.", appointment });
  } catch (error) {
    if (error.code === 11000) {
      // Compound index collision: doctorId + date + timeSlot
      return res.status(409).json({ error: "This time slot has already been booked by someone else. Please choose another." });
    }
    console.error("[POST /book] Error:", error.message);
    return res.status(500).json({ error: "Failed to book appointment." });
  }
};

// @desc    Cancel appointment (Patient only, >1 hr in advance)
// @route   DELETE /api/appointments/:id/cancel
// @access  Private (Patient)
exports.cancelAppointment = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: "Only patients can cancel appointments." });
    }

    const aptId = req.params.id; // Usually "APT-XXX"
    const appointment = await Appointment.findOne({ 
      appointmentId: aptId,
      patientId: req.user.referenceId
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found." });
    }
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: "Appointment is already cancelled." });
    }

    // Robust date parsing for local time comparison
    const [year, month, day] = appointment.date.split('-');
    const [hours, minutes] = appointment.timeSlot.split(':');
    
    const appointmentTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours, 10), parseInt(minutes, 10));
    const currentTime = new Date();

    const timeDifferenceInMs = appointmentTime.getTime() - currentTime.getTime();
    const timeDifferenceInMinutes = timeDifferenceInMs / (1000 * 60);

    if (timeDifferenceInMinutes < 60) {
      return res.status(400).json({ error: "Appointments can only be cancelled at least 1 hour prior to the scheduled time." });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const io = req.app.get('io');
    if (io) {
      io.to(appointment.doctorId).emit('appointmentCancelled', {
        date: appointment.date,
        timeSlot: appointment.timeSlot
      });
    }

    return res.json({ message: "Appointment successfully cancelled.", appointment });
  } catch (error) {
    console.error("[DELETE /cancel] Error:", error.message);
    return res.status(500).json({ error: "Failed to cancel appointment." });
  }
};

// @desc    Get master schedule (Admin only)
// @route   GET /api/appointments/schedule
// @access  Private (Admin)
exports.getMasterSchedule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { date } = req.query; // Optional filter

    let query = {};
    if (date) query.date = date;

    const appointments = await Appointment.find(query)
      .sort({ date: 1, timeSlot: 1 })
      .lean();

    return res.json({ appointments });
  } catch (error) {
    console.error("[GET /schedule] Error:", error.message);
    return res.status(500).json({ error: "Failed to fetch master schedule." });
  }
};

// @desc    Get doctor's active appointments agenda merged with availability slots
// @route   GET /api/appointments/doctor-agenda
// @access  Private (Doctor)
exports.getDoctorAgenda = async (req, res) => {
  try {
    const doctorId = req.user.referenceId;
    
    // 1. Fetch Doctor and Availability
    const doctor = await Doctor.findOne({ id: doctorId }).lean();
    if (!doctor || !doctor.availability) {
      return res.json({ schedule: [] });
    }

    // 2. Fetch all active appointments for this doctor
    const appointments = await Appointment.find({ doctorId, status: { $ne: 'cancelled' } })
      .lean();

    // Populate patient info manually
    const patientIds = appointments.map(a => a.patientId);
    const patients = await Patient.find({ id: { $in: patientIds } })
      .select("id name tokenNumber phone")
      .lean();
    
    const patientMap = {};
    patients.forEach(p => patientMap[p.id] = p);

    const aptMap = {}; // Keyed by date_timeSlot
    appointments.forEach(apt => {
      aptMap[`${apt.date}_${apt.timeSlot}`] = {
        ...apt,
        patient: patientMap[apt.patientId] || { name: "Unknown Patient" }
      };
    });

    // 3. Generate merged schedule
    const schedule = [];
    
    for (const day of doctor.availability) {
      const daySlots = [];
      
      if (day.slots) {
        for (const block of day.slots) {
          const generated = generateTimeSlots(block.startTime, block.endTime, parseInt(block.duration) || 30);
          for (const timeStr of generated) {
            const [year, month, dayStr] = day.date.split('-');
            const [hours, minutes] = timeStr.split(':');
            const slotDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(dayStr), parseInt(hours, 10), parseInt(minutes, 10));
            const now = new Date();

            const booked = aptMap[`${day.date}_${timeStr}`];
            if (booked) {
              daySlots.push({ time: timeStr, status: "Booked", patient: booked.patient });
            } else if (slotDateTime < now) {
              daySlots.push({ time: timeStr, status: "Expired" });
            } else {
              daySlots.push({ time: timeStr, status: "Available" });
            }
          }
        }
      }
      
      // Sort the daySlots by time
      daySlots.sort((a, b) => a.time.localeCompare(b.time));

      schedule.push({
        date: day.date, // "YYYY-MM-DD"
        slots: daySlots
      });
    }

    return res.json({ schedule });
  } catch (error) {
    console.error("[GET /doctor-agenda] Error:", error.message);
    return res.status(500).json({ error: "Failed to fetch merged doctor agenda." });
  }
};
