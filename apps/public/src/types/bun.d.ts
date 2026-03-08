/**
 * Déclarations de types minimales pour l'API Bun.password
 * Ces types permettent à TypeScript de reconnaître l'API de hashing de Bun
 */

declare namespace Bun {
  namespace password {
    /**
     * Hash un mot de passe avec bcrypt par défaut
     * @param password Le mot de passe en clair à hasher
     * @param options Options optionnelles (algorithme, coût)
     * @returns Promise du hash généré
     */
    function hash(
      password: string | BufferSource,
      options?: {
        algorithm?: "bcrypt" | "argon2id" | "argon2i" | "argon2d";
        cost?: number;
      }
    ): Promise<string>;

    /**
     * Vérifie un mot de passe contre un hash
     * @param password Le mot de passe en clair
     * @param hash Le hash à vérifier
     * @returns Promise<boolean> true si le mot de passe correspond
     */
    function verify(
      password: string | BufferSource,
      hash: string,
      algorithm?: "bcrypt" | "argon2id" | "argon2i" | "argon2d"
    ): Promise<boolean>;
  }
}
