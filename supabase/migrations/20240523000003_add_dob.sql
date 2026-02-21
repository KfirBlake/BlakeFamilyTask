-- Remove the age column
alter table public.profiles 
drop column age;

-- Add date_of_birth column
alter table public.profiles 
add column date_of_birth date;
