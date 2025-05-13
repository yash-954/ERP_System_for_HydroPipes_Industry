/**
 * Password utility functions for generating and working with passwords
 */

/**
 * Generate a random secure password
 * @param length Length of the password to generate (default: 10)
 * @param includeSpecialChars Whether to include special characters (default: true)
 * @returns A randomly generated secure password
 */
export function generateSecurePassword(length: number = 10, includeSpecialChars: boolean = true): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numericChars = '0123456789';
  const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  
  // Combine character sets based on options
  let allChars = uppercaseChars + lowercaseChars + numericChars;
  if (includeSpecialChars) {
    allChars += specialChars;
  }
  
  let password = '';
  
  // Ensure at least one character from each required set
  password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
  password += numericChars.charAt(Math.floor(Math.random() * numericChars.length));
  
  if (includeSpecialChars) {
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  }
  
  // Fill the rest of the password with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters to avoid predictable patterns
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Evaluate the strength of a password
 * @param password The password to evaluate
 * @returns A score from 0 (very weak) to 4 (very strong)
 */
export function evaluatePasswordStrength(password: string): {
  score: number;
  feedback: string;
} {
  if (!password) {
    return { score: 0, feedback: 'Password is empty' };
  }
  
  let score = 0;
  const feedback = [];
  
  // Length check
  if (password.length < 6) {
    feedback.push('Password is too short');
  } else if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
  }
  
  // Character variety checks
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // Normalize score to 0-4 range
  score = Math.min(4, score);
  
  // Generate feedback based on score
  switch (score) {
    case 0:
      feedback.push('Very weak password');
      break;
    case 1:
      feedback.push('Weak password. Consider adding uppercase letters, numbers, or special characters.');
      break;
    case 2:
      feedback.push('Fair password. Add more variety for better security.');
      break;
    case 3:
      feedback.push('Good password.');
      break;
    case 4:
      feedback.push('Strong password!');
      break;
  }
  
  return {
    score,
    feedback: feedback.join(' ')
  };
} 