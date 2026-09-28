import { db, withDbRetry } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    return await withDbRetry(async () => {
      const result = await db
        .insert(users)
        .values({
          uid,
          email,
          displayName: displayName || email.split('@')[0],
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
            displayName: displayName || email.split('@')[0],
          },
        })
        .returning();

      return result[0];
    });
  } catch (error) {
    console.error('Database user query failed:', error);
    throw new Error('Database user operation failed. Please try again later.', { cause: error });
  }
}

export async function getAllUsers() {
  try {
    return await withDbRetry(async () => {
      return await db.select().from(users);
    });
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
