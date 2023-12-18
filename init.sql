CREATE TABLE public.consumers_info (
id uuid NOT NULL,
consumer_id uuid NULL, 
api_user text NULL,
api_password text NULL,
CONSTRAINT consumers_info_pkey PRIMARY KEY (id)
);

CREATE INDEX consumers_info_api_user_idx ON public.consumers_info USING btree (lower(api_user));
ALTER TABLE public.consumers_info ADD CONSTRAINT consumers_info_consumer_id_fkey FOREIGN KEY (consumer_id) REFERENCES public.consumers(id) ON DELETE CASCADE;