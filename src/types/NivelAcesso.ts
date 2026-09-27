const NivelAcesso = {
  USUARIO: "USUARIO",
  EMPRESA: "EMPRESA",
  ADMIN: "ADMIN",
};

export type NivelAcesso = (typeof NivelAcesso)[keyof typeof NivelAcesso];
