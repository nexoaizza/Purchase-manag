import { fr } from 'date-fns/locale';
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'de','fr','ar'],
 
  // Used when no locale matches
  defaultLocale: 'en'
});