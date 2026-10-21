/** Politique de mot de passe imposée par le Kernel (RT-Comops) : au moins 10
 * caractères, une majuscule, une minuscule, un chiffre et un symbole. Une
 * validation plus faible côté client laisserait passer des requêtes que le
 * Kernel rejette de toute façon, avec un message brut peu clair pour l'utilisateur.
 */
export function checkPasswordStrength(password: string) {
  return {
    length: password.length >= 10,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordStrong(password: string): boolean {
  const s = checkPasswordStrength(password);
  return s.length && s.upper && s.lower && s.digit && s.symbol;
}
