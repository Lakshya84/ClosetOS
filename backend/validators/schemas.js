const { z } = require('zod');

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^[^\s]+$/, 'Password must not contain spaces')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
      'Password must contain at least one letter, one number, and one special character'
    ),
  displayName: z.string().min(2, 'Display name must be at least 2 characters long').max(50)
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

const CreateItemSchema = z.object({
  name: z.string().min(1, 'Accessory name is required').max(100),
  brand: z.string().min(1, 'Brand is required').max(100),
  category: z.enum(['Bag', 'Shoes', 'Jewellery', 'Sunglasses', 'Belt', 'Watch', 'Other'], {
    errorMap: () => ({ message: 'Category must be one of: Bag, Shoes, Jewellery, Sunglasses, Belt, Watch, Other' })
  }),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(''),
  purchasePrice: z.number().nonnegative().optional(),
  acquiredOn: z.string().datetime({ message: 'Acquired Date must be a valid ISO string' }).optional().or(z.string().date().optional()),
  coverImageUrl: z.string().url().optional().or(z.literal(''))
});

const UpdateItemSchema = CreateItemSchema.partial();

const TransferItemSchema = z.object({
  toStatus: z.enum(['IN_CLOSET', 'ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR', 'MISSING']),
  recipientName: z.string().optional(),
  recipientContact: z.string().optional(),
  returnDate: z.string().optional()
}).refine((data) => {
  // If moving to an OUT status, recipientName and returnDate are strictly required
  const outStatuses = ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'];
  if (outStatuses.includes(data.toStatus)) {
    return !!data.recipientName && !!data.returnDate;
  }
  return true;
}, {
  message: 'Recipient Name and Return Date are required when transitioning to an OUT status (ON_LOAN, SENT_TO_STYLIST, AT_PR)',
  path: ['recipientName']
});

module.exports = {
  RegisterSchema,
  LoginSchema,
  CreateItemSchema,
  UpdateItemSchema,
  TransferItemSchema
};
