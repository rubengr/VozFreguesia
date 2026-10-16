/**
 * Voz da Freguesia - Frontend
 * ---------------------------------------------------------------------------
 * Endereço do backend. Em desenvolvimento usa o localhost; em produção deve
 * ser definido na variável de ambiente REACT_APP_API_URL no momento do
 * build (`npm run build`), para que a app aponte para o servidor real em
 * vez de para a máquina de quem a está a usar.
 *
 * Copyright (c) MicroSystems
 * Author: Rúben Rodrigues
 * ---------------------------------------------------------------------------
 */

export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";
