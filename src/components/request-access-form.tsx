'use client';

import { requestAccess } from '@/lib/actions';
import { FormPanel, Field } from './form-panel';

export function RequestAccessForm() {
  return (
    <FormPanel
      title="Request access"
      openLabel="Not on the list? Request access"
      submitLabel="Send request"
      action={requestAccess}
    >
      <Field label="Your email" name="email" type="email" required placeholder="you@gmail.com" span />
      <Field label="Your name" name="name" placeholder="So the committee knows who's asking" span />
      <Field label="Message (optional)" name="message" span />
    </FormPanel>
  );
}
