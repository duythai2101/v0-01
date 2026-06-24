export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      // Define your tables here if needed
    }
    Views: {
      // Define your views here if needed
    }
    Functions: {
      // Define your functions here if needed
    }
  }
}
