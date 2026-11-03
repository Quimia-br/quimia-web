/** Text fields may have saved before the independent photo endpoint fails. */
export class ProfilePhotoError extends Error {
  readonly fieldsSaved: boolean;
  constructor(cause: unknown, fieldsSaved: boolean) {
    super("Não foi possível enviar a foto.", { cause });
    this.fieldsSaved = fieldsSaved;
  }
}
