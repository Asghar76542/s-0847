export type SingleRole = 'member' | 'collector' | 'admin';
export type UserRole = SingleRole | `${SingleRole},${SingleRole}` | `${SingleRole},${SingleRole},${SingleRole}`;