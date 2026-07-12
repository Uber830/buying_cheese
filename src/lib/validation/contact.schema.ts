import { z } from 'zod';

const phoneRegex = /^[+0-9 ()\-]{7,20}$/;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Ingresa tu nombre (mínimo 2 caracteres).')
    .max(120, 'El nombre es demasiado largo.'),
  email: z
    .string()
    .trim()
    .min(1, 'Ingresa tu correo electrónico.')
    .email('El correo no tiene un formato válido.'),
  phone: z
    .string()
    .trim()
    .min(7, 'Ingresa un teléfono válido.')
    .max(20)
    .regex(phoneRegex, 'Solo dígitos, espacios, +, -, ( y ).'),
  message: z
    .string()
    .trim()
    .min(10, 'Cuéntanos un poco más (mínimo 10 caracteres).')
    .max(2000, 'El mensaje es demasiado largo.'),
  hp_field: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
