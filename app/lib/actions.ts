'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100; // convert to cents
    const date = new Date().toISOString().split('T')[0]; //create a new date with the format "YYYY-MM-DD" for the invoice's creation date:
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    /* 
    Next.js has a Client-side Router Cache that stores the route segments in the user's browser for a time. 
    Along with prefetching, this cache ensures that users can quickly navigate between routes 
    while reducing the number of requests made to the server.

    Since data that's being displayed is being updated in the invoices route, 
    we want to clear this cache and trigger a new request to the server. 
    we can do this with the revalidatePath function from Next.js
    */
    revalidatePath('/dashboard/invoices'); // clears cache and triggers a new request to the server which updates data being displayed
    redirect('/dashboard/invoices'); // redirect user
}