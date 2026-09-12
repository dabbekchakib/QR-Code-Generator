import type {
  TemplateFieldDescriptor,
  TemplateFieldValue,
} from "../types";

export const NAME_FIELD: TemplateFieldDescriptor = {
  key: "name",
  type: "text",
  labelKey: "templates.fields.name",
  placeholderKey: "templates.placeholders.name",
  required: true,
  default: "",
};

export function urlField(
  labelKey: string,
  placeholderKey: string,
  helperKey = "templates.helpers.url"
): TemplateFieldDescriptor {
  return {
    key: "url",
    type: "url",
    labelKey,
    placeholderKey,
    helperKey,
    required: true,
    default: "",
  };
}

export function textField(
  key: string,
  labelKey: string,
  required = false
): TemplateFieldDescriptor {
  return {
    key,
    type: "text",
    labelKey,
    required,
    default: "",
  };
}

/** Start with a neutral, non-personal default map. */
export function neutralValues(pairs: Record<string, TemplateFieldValue>) {
  return pairs;
}