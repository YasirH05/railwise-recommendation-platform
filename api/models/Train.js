import mongoose from 'mongoose';

const trainSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true },
  trainName: { type: String, required: true },
  departureStation: { type: String, required: true },
  arrivalStation: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  duration: { type: String, required: true },
  prices: { type: Object, required: true },
  availableSeats: { type: Number, required: true },
  metrics: {
    reliabilityRating: { type: Number, required: true, min: 0, max: 10 },
    comfortRating: { type: Number, required: true, min: 0, max: 10 },
    foodRating: { type: Number, required: true, min: 0, max: 10 },
  }
}, { timestamps: true });

const Train = mongoose.model('Train', trainSchema);

export default Train;
