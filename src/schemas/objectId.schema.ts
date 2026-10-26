import isObjectId from "../utils/isObjectId";
import { requiredStringSchema } from "./required.schema";

const objectIdSchema = (name: string) => {
    return requiredStringSchema(name).refine((id) => isObjectId(id), {
        message: `${name} must be a valid ObjectId`,
    });
}

export default objectIdSchema;

