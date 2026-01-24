import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})



export const adminRegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    businessName: z.string().min(2, 'Business Name is required'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})


export const customerRegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    businessCode: z.string().min(1, 'Business Code is required'),
    fullName: z.string().min(2, 'Full Name is required'),
    phone: z.string().min(5, 'Phone Number is required'),
    address: z.string().min(5, 'Address is required'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export const loanProductSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    min_amount: z.coerce.number().min(0).optional(),
    max_amount: z.coerce.number().min(0).optional(),
    requires_collateral: z.boolean().default(false),
    requires_kyc: z.boolean().default(true),
    is_active: z.boolean().default(true),
})

export const loanProductRateSchema = z.object({
    product_id: z.string().uuid(),
    duration_unit: z.enum(['month', 'week']),
    duration_value: z.coerce.number().min(1),
    interest_rate: z.coerce.number().min(0),
})

export const paymentConfigSchema = z.object({
    mobile_money_instructions: z.string().optional(),
    bank_transfer_instructions: z.string().optional(),
    general_instructions: z.string().optional(),
})
