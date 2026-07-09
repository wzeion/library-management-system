import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILoan extends Document {
  book: mongoose.Types.ObjectId;
  member: mongoose.Types.ObjectId;
  issuedBy: mongoose.Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: 'active' | 'returned' | 'overdue';
  fineId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: { type: String, enum: ['active', 'returned', 'overdue'], default: 'active', index: true },
    fineId: { type: Schema.Types.ObjectId, ref: 'Fine', default: null },
  },
  { timestamps: true }
);

const Loan: Model<ILoan> = mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);
export default Loan;
