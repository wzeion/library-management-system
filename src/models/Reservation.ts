import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReservation extends Document {
  book: mongoose.Types.ObjectId;
  member: mongoose.Types.ObjectId;
  reservedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'fulfilled' | 'cancelled' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reservedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    status: { type: String, enum: ['pending', 'fulfilled', 'cancelled', 'expired'], default: 'pending', index: true },
  },
  { timestamps: true }
);

const Reservation: Model<IReservation> = mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);
export default Reservation;
