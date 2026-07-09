import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFine extends Document {
  loan: mongoose.Types.ObjectId;
  member: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  status: 'unpaid' | 'paid' | 'waived';
  createdAt: Date;
  resolvedAt: Date | null;
}

const FineSchema = new Schema<IFine>(
  {
    loan: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    status: { type: String, enum: ['unpaid', 'paid', 'waived'], default: 'unpaid', index: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Fine: Model<IFine> = mongoose.models.Fine || mongoose.model<IFine>('Fine', FineSchema);
export default Fine;
