declare namespace App {
  interface Locals {
    // Username of the signed-in admin, set by src/middleware.ts on admin routes.
    admin?: string;
  }
}
