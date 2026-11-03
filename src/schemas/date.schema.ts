import { requiredStringSchema } from "./required.schema";

export const dateFormatRegex = /^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const dateSchema = (fieldName: string) => {
    return requiredStringSchema(fieldName)
        .superRefine((date, ctx) => {
            // validate date format
            if (!dateFormatRegex.test(date)) {
                ctx.addIssue({
                    code: "custom",
                    message: `${fieldName} must be 'YYYY-MM-DD' format`,
                });
                return;
            }
        })
}

export default dateSchema;