-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.areas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  capacity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  CONSTRAINT areas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.booking_settings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  interval_minutes integer DEFAULT 15,
  max_covers_per_interval integer DEFAULT 20,
  default_turn_time integer DEFAULT 15,
  duration_rules jsonb DEFAULT '{"2": 90, "4": 105, "6": 120, "10": 150}'::jsonb,
  CONSTRAINT booking_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  customer_name text NOT NULL,
  booking_time timestamp with time zone NOT NULL,
  guests integer DEFAULT 2,
  phone text,
  table_number text,
  status text DEFAULT 'confirmed'::text,
  customer_phone text,
  customer_email text,
  customer_tags jsonb DEFAULT '[]'::jsonb,
  duration_minutes integer DEFAULT 90,
  turn_time_minutes integer DEFAULT 15,
  party_size integer DEFAULT 2,
  booking_source text DEFAULT 'WALK_IN'::text,
  table_id bigint,
  expected_end_time timestamp with time zone,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.dining_tables(id)
);
CREATE TABLE public.branch_ingredient_stock (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  branch_id uuid,
  ingredient_id uuid,
  current_stock numeric DEFAULT 0,
  low_stock_threshold numeric DEFAULT 5,
  CONSTRAINT branch_ingredient_stock_pkey PRIMARY KEY (id),
  CONSTRAINT branch_ingredient_stock_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT branch_ingredient_stock_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);
CREATE TABLE public.branch_product_stock (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  branch_id uuid,
  variant_id uuid,
  stock_quantity integer DEFAULT 0,
  CONSTRAINT branch_product_stock_pkey PRIMARY KEY (id),
  CONSTRAINT branch_product_stock_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT branch_product_stock_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id)
);
CREATE TABLE public.branches (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  org_id uuid,
  name text NOT NULL,
  address text,
  timezone text DEFAULT 'UTC'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT branches_pkey PRIMARY KEY (id),
  CONSTRAINT branches_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  loyalty_points integer DEFAULT 0,
  total_spend bigint DEFAULT 0,
  last_visit timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dining_tables (
  id integer NOT NULL DEFAULT nextval('dining_tables_id_seq'::regclass),
  table_number text NOT NULL UNIQUE,
  status text DEFAULT 'AVAILABLE'::text CHECK (status = ANY (ARRAY['AVAILABLE'::text, 'OCCUPIED'::text, 'RESERVED'::text])),
  current_order_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  branch_id uuid DEFAULT 'a798abd7-2ab8-4419-8bb6-d77bd584a2bf'::uuid,
  area_id bigint,
  min_covers integer DEFAULT 2,
  max_covers integer DEFAULT 4,
  is_combinable boolean DEFAULT false,
  CONSTRAINT dining_tables_pkey PRIMARY KEY (id),
  CONSTRAINT dining_tables_current_order_id_fkey FOREIGN KEY (current_order_id) REFERENCES public.orders(id),
  CONSTRAINT dining_tables_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT dining_tables_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id)
);
CREATE TABLE public.gift_card_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  card_code text,
  amount numeric NOT NULL,
  transaction_type text NOT NULL,
  order_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gift_card_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT gift_card_transactions_card_code_fkey FOREIGN KEY (card_code) REFERENCES public.gift_cards(code)
);
CREATE TABLE public.gift_cards (
  code text NOT NULL,
  balance numeric DEFAULT 0 CHECK (balance >= 0::numeric),
  status text DEFAULT 'ACTIVE'::text,
  created_at timestamp with time zone DEFAULT now(),
  expiry_date timestamp with time zone,
  CONSTRAINT gift_cards_pkey PRIMARY KEY (code)
);
CREATE TABLE public.ingredients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  unit text DEFAULT 'kg'::text,
  cost_per_unit numeric DEFAULT 0,
  current_stock numeric DEFAULT 0,
  low_stock_threshold numeric DEFAULT 5,
  created_at timestamp with time zone DEFAULT now(),
  org_id uuid DEFAULT 'c00c74bb-ff22-4cb0-a361-ac6dbb1daa31'::uuid,
  CONSTRAINT ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT ingredients_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.kitchen_tickets (
  id integer NOT NULL DEFAULT nextval('kitchen_tickets_id_seq'::regclass),
  table_number text NOT NULL,
  items jsonb NOT NULL,
  status text DEFAULT 'PENDING'::text,
  created_at timestamp with time zone DEFAULT now(),
  active boolean DEFAULT true,
  branch_id uuid DEFAULT 'a798abd7-2ab8-4419-8bb6-d77bd584a2bf'::uuid,
  CONSTRAINT kitchen_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT kitchen_tickets_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);
CREATE TABLE public.modifier_groups (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid,
  name text NOT NULL,
  min_selection integer DEFAULT 0,
  max_selection integer DEFAULT 1,
  required boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT modifier_groups_pkey PRIMARY KEY (id),
  CONSTRAINT modifier_groups_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.modifiers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  group_id uuid,
  name text NOT NULL,
  price_adjustment integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT modifiers_pkey PRIMARY KEY (id),
  CONSTRAINT modifiers_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.modifier_groups(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  variant_id uuid,
  product_name_snapshot text,
  quantity integer DEFAULT 1,
  price_at_sale integer NOT NULL,
  modifiers jsonb DEFAULT '[]'::jsonb,
  branch_id uuid DEFAULT 'a798abd7-2ab8-4419-8bb6-d77bd584a2bf'::uuid,
  cost_at_sale numeric DEFAULT 0,
  tax_amount_at_sale numeric DEFAULT 0,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id),
  CONSTRAINT order_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  status text DEFAULT 'PENDING'::text,
  total_amount integer NOT NULL DEFAULT 0,
  payment_method text,
  device_id text,
  branch_id uuid DEFAULT 'a798abd7-2ab8-4419-8bb6-d77bd584a2bf'::uuid,
  customer_id uuid,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  owner_id uuid,
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.product_ingredients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  variant_id uuid,
  ingredient_id uuid,
  quantity_required numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT product_ingredients_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id),
  CONSTRAINT product_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  image_url text,
  tax_rate numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  org_id uuid DEFAULT 'c00c74bb-ff22-4cb0-a361-ac6dbb1daa31'::uuid,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.purchase_order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  po_id uuid,
  ingredient_id uuid,
  quantity_ordered numeric NOT NULL,
  cost_per_unit numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id),
  CONSTRAINT purchase_order_items_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);
CREATE TABLE public.purchase_orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  branch_id uuid,
  supplier_id uuid,
  status text DEFAULT 'DRAFT'::text,
  total_cost numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  received_at timestamp with time zone,
  CONSTRAINT purchase_orders_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
);
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.shifts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  staff_name text,
  clock_in timestamp with time zone DEFAULT now(),
  clock_out timestamp with time zone,
  hourly_rate numeric,
  total_pay numeric,
  status text DEFAULT 'ACTIVE'::text,
  CONSTRAINT shifts_pkey PRIMARY KEY (id),
  CONSTRAINT shifts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.staff_directory (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  first_name text,
  last_name text,
  email text,
  role text DEFAULT 'cashier'::text,
  branch_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_directory_pkey PRIMARY KEY (id),
  CONSTRAINT staff_directory_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  org_id uuid,
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  currency text DEFAULT 'USD'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id),
  CONSTRAINT suppliers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.table_cart_items (
  id integer NOT NULL DEFAULT nextval('table_cart_items_id_seq'::regclass),
  table_number text NOT NULL,
  variant_id uuid NOT NULL,
  product_name text NOT NULL,
  price_at_addition integer NOT NULL,
  quantity integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'DRAFT'::text CHECK (status = ANY (ARRAY['DRAFT'::text, 'SENT'::text, 'VOIDED'::text])),
  modifiers jsonb DEFAULT '[]'::jsonb,
  branch_id uuid DEFAULT 'a798abd7-2ab8-4419-8bb6-d77bd584a2bf'::uuid,
  CONSTRAINT table_cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT table_cart_items_table_number_fkey FOREIGN KEY (table_number) REFERENCES public.dining_tables(table_number),
  CONSTRAINT table_cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id),
  CONSTRAINT table_cart_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);
CREATE TABLE public.variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  name text NOT NULL,
  sku text,
  price integer NOT NULL,
  stock_count integer DEFAULT 0,
  stock_quantity integer DEFAULT 0,
  track_stock boolean DEFAULT false,
  org_id uuid DEFAULT 'c00c74bb-ff22-4cb0-a361-ac6dbb1daa31'::uuid,
  CONSTRAINT variants_pkey PRIMARY KEY (id),
  CONSTRAINT variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT variants_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  customer_name text NOT NULL,
  contact_info text,
  party_size integer NOT NULL,
  quoted_wait_time integer,
  status text DEFAULT 'WAITING'::text,
  CONSTRAINT waitlist_pkey PRIMARY KEY (id)
);
CREATE TABLE public.wastage_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ingredient_id uuid,
  quantity_wasted numeric NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wastage_logs_pkey PRIMARY KEY (id),
  CONSTRAINT wastage_logs_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);
- -   M i g r a t i o n :   C r e a t e   s e l l _ i t e m s   R P C   f o r   a t o m i c   t r a n s a c t i o n s   a n d   s t o c k   d e d u c t i o n  
 - -   A l s o   a d d s   i n c r e m e n t _ g i f t _ c a r d _ b a l a n c e   R P C  
  
 - -   1 .   C r e a t e   t y p e   f o r   o r d e r   i t e m   i n p u t   i f   n e e d e d ,   o r   j u s t   u s e   J S O N B  
 - -   W e   w i l l   u s e   J S O N B   f o r   f l e x i b i l i t y :    
 - -   p a y l o a d :   {    
 - -       b r a n c h I d :   u u i d ,    
 - -       t o t a l A m o u n t :   n u m b e r ,    
 - -       p a y m e n t M e t h o d :   t e x t ,    
 - -       c u s t o m e r I d :   u u i d   ( o p t i o n a l ) ,    
 - -       i t e m s :   [   {   v a r i a n t _ i d :   u u i d ,   q u a n t i t y :   n u m b e r ,   p r i c e :   n u m b e r ,   m o d i f i e r s :   [ ]   }   ]    
 - -   }  
  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . s e l l _ i t e m s ( o r d e r _ p a y l o a d   j s o n b )  
 R E T U R N S   j s o n b  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 A S   $ $  
 D E C L A R E  
     v _ o r d e r _ i d   u u i d ;  
     v _ i t e m   j s o n b ;  
     v _ v a r i a n t _ i d   u u i d ;  
     v _ q u a n t i t y   i n t ;  
     v _ t o t a l _ a m o u n t   n u m e r i c ;  
     v _ r e c i p e   r e c o r d ;  
     v _ i n g r e d i e n t _ d e d u c t i o n   n u m e r i c ;  
 B E G I N  
     - -   1 .   I n s e r t   O r d e r  
     I N S E R T   I N T O   p u b l i c . o r d e r s   (  
         b r a n c h _ i d ,  
         t o t a l _ a m o u n t ,  
         p a y m e n t _ m e t h o d ,  
         c u s t o m e r _ i d ,  
         s t a t u s ,  
         c r e a t e d _ a t  
     )   V A L U E S   (  
         ( o r d e r _ p a y l o a d - > > ' b r a n c h I d ' ) : : u u i d ,  
         ( o r d e r _ p a y l o a d - > > ' t o t a l A m o u n t ' ) : : n u m e r i c ,  
         o r d e r _ p a y l o a d - > > ' p a y m e n t M e t h o d ' ,  
         ( o r d e r _ p a y l o a d - > > ' c u s t o m e r I d ' ) : : u u i d ,  
         ' C O M P L E T E D ' ,  
         N O W ( )  
     )   R E T U R N I N G   i d   I N T O   v _ o r d e r _ i d ;  
  
     - -   2 .   P r o c e s s   I t e m s  
     F O R   v _ i t e m   I N   S E L E C T   *   F R O M   j s o n b _ a r r a y _ e l e m e n t s ( o r d e r _ p a y l o a d - > ' i t e m s ' )  
     L O O P  
         v _ v a r i a n t _ i d   : =   ( v _ i t e m - > > ' i d ' ) : : u u i d ;   - -   A s s u m i n g   ' i d '   m a t c h e s   v a r i a n t _ i d   i n   p a y l o a d  
         v _ q u a n t i t y   : =   ( v _ i t e m - > > ' q u a n t i t y ' ) : : i n t ;  
  
         - -   I n s e r t   O r d e r   I t e m  
         I N S E R T   I N T O   p u b l i c . o r d e r _ i t e m s   (  
             o r d e r _ i d ,  
             v a r i a n t _ i d ,  
             q u a n t i t y ,  
             p r i c e _ a t _ s a l e ,  
             m o d i f i e r s  
         )   V A L U E S   (  
             v _ o r d e r _ i d ,  
             v _ v a r i a n t _ i d ,  
             v _ q u a n t i t y ,  
             ( v _ i t e m - > > ' p r i c e ' ) : : n u m e r i c ,  
             v _ i t e m - > ' m o d i f i e r s '  
         ) ;  
  
         - -   3 .   D e d u c t   I n g r e d i e n t s   ( A t o m i c   S t o c k   M a n a g e m e n t )  
         F O R   v _ r e c i p e   I N    
             S E L E C T   i n g r e d i e n t _ i d ,   q u a n t i t y _ r e q u i r e d    
             F R O M   p u b l i c . p r o d u c t _ i n g r e d i e n t s    
             W H E R E   v a r i a n t _ i d   =   v _ v a r i a n t _ i d  
         L O O P  
             v _ i n g r e d i e n t _ d e d u c t i o n   : =   v _ r e c i p e . q u a n t i t y _ r e q u i r e d   *   v _ q u a n t i t y ;  
  
             U P D A T E   p u b l i c . i n g r e d i e n t s  
             S E T   c u r r e n t _ s t o c k   =   c u r r e n t _ s t o c k   -   v _ i n g r e d i e n t _ d e d u c t i o n  
             W H E R E   i d   =   v _ r e c i p e . i n g r e d i e n t _ i d ;  
              
             - -   O p t i o n a l :   L o g   w a s t a g e   o r   c h e c k   f o r   l o w   s t o c k   h e r e   i f   n e e d e d  
         E N D   L O O P ;  
  
         - -   4 .   D e d u c t   V a r i a n t   S t o c k   ( i f   t r a c k e d )  
         U P D A T E   p u b l i c . v a r i a n t s  
         S E T   s t o c k _ q u a n t i t y   =   s t o c k _ q u a n t i t y   -   v _ q u a n t i t y  
         W H E R E   i d   =   v _ v a r i a n t _ i d   A N D   t r a c k _ s t o c k   =   t r u e ;  
  
     E N D   L O O P ;  
  
     R E T U R N   j s o n b _ b u i l d _ o b j e c t (  
         ' s u c c e s s ' ,   t r u e ,  
         ' o r d e r _ i d ' ,   v _ o r d e r _ i d  
     ) ;  
 E X C E P T I O N   W H E N   O T H E R S   T H E N  
     R A I S E   E X C E P T I O N   ' T r a n s a c t i o n   f a i l e d :   % ' ,   S Q L E R R M ;  
 E N D ;  
 $ $ ;  
  
 - -   2 .   G i f t   C a r d   R e c h a r g e   R P C  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . i n c r e m e n t _ g i f t _ c a r d _ b a l a n c e ( c a r d _ i d   u u i d ,   a m o u n t   n u m e r i c )  
 R E T U R N S   v o i d  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 A S   $ $  
 B E G I N  
     U P D A T E   p u b l i c . g i f t _ c a r d s  
     S E T   c u r r e n t _ b a l a n c e   =   c u r r e n t _ b a l a n c e   +   a m o u n t ,  
             l a s t _ u s e d   =   N O W ( )  
     W H E R E   i d   =   c a r d _ i d ;  
 E N D ;  
 $ $ ;  
 - -   M i g r a t i o n :   C r e a t e   s e l l _ i t e m s   R P C   f o r   a t o m i c   t r a n s a c t i o n s   a n d   s t o c k   d e d u c t i o n  
 - -   A l s o   a d d s   i n c r e m e n t _ g i f t _ c a r d _ b a l a n c e   R P C  
  
 - -   1 .   C r e a t e   t y p e   f o r   o r d e r   i t e m   i n p u t   i f   n e e d e d ,   o r   j u s t   u s e   J S O N B  
 - -   W e   w i l l   u s e   J S O N B   f o r   f l e x i b i l i t y :    
 - -   p a y l o a d :   {    
 - -       b r a n c h I d :   u u i d ,    
 - -       t o t a l A m o u n t :   n u m b e r ,    
 - -       p a y m e n t M e t h o d :   t e x t ,    
 - -       c u s t o m e r I d :   u u i d   ( o p t i o n a l ) ,    
 - -       i t e m s :   [   {   v a r i a n t _ i d :   u u i d ,   q u a n t i t y :   n u m b e r ,   p r i c e :   n u m b e r ,   m o d i f i e r s :   [ ]   }   ]    
 - -   }  
  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . s e l l _ i t e m s ( o r d e r _ p a y l o a d   j s o n b )  
 R E T U R N S   j s o n b  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 A S   $ $  
 D E C L A R E  
     v _ o r d e r _ i d   u u i d ;  
     v _ i t e m   j s o n b ;  
     v _ v a r i a n t _ i d   u u i d ;  
     v _ q u a n t i t y   i n t ;  
     v _ t o t a l _ a m o u n t   n u m e r i c ;  
     v _ r e c i p e   r e c o r d ;  
     v _ i n g r e d i e n t _ d e d u c t i o n   n u m e r i c ;  
 B E G I N  
     - -   1 .   I n s e r t   O r d e r  
     I N S E R T   I N T O   p u b l i c . o r d e r s   (  
         b r a n c h _ i d ,  
         t o t a l _ a m o u n t ,  
         p a y m e n t _ m e t h o d ,  
         c u s t o m e r _ i d ,  
         s t a t u s ,  
         c r e a t e d _ a t  
     )   V A L U E S   (  
         ( o r d e r _ p a y l o a d - > > ' b r a n c h I d ' ) : : u u i d ,  
         ( o r d e r _ p a y l o a d - > > ' t o t a l A m o u n t ' ) : : n u m e r i c ,  
         o r d e r _ p a y l o a d - > > ' p a y m e n t M e t h o d ' ,  
         ( o r d e r _ p a y l o a d - > > ' c u s t o m e r I d ' ) : : u u i d ,  
         ' C O M P L E T E D ' ,  
         N O W ( )  
     )   R E T U R N I N G   i d   I N T O   v _ o r d e r _ i d ;  
  
     - -   2 .   P r o c e s s   I t e m s  
     F O R   v _ i t e m   I N   S E L E C T   *   F R O M   j s o n b _ a r r a y _ e l e m e n t s ( o r d e r _ p a y l o a d - > ' i t e m s ' )  
     L O O P  
         v _ v a r i a n t _ i d   : =   ( v _ i t e m - > > ' i d ' ) : : u u i d ;   - -   A s s u m i n g   ' i d '   m a t c h e s   v a r i a n t _ i d   i n   p a y l o a d  
         v _ q u a n t i t y   : =   ( v _ i t e m - > > ' q u a n t i t y ' ) : : i n t ;  
  
         - -   I n s e r t   O r d e r   I t e m  
         I N S E R T   I N T O   p u b l i c . o r d e r _ i t e m s   (  
             o r d e r _ i d ,  
             v a r i a n t _ i d ,  
             q u a n t i t y ,  
             p r i c e _ a t _ s a l e ,  
             m o d i f i e r s  
         )   V A L U E S   (  
             v _ o r d e r _ i d ,  
             v _ v a r i a n t _ i d ,  
             v _ q u a n t i t y ,  
             ( v _ i t e m - > > ' p r i c e ' ) : : n u m e r i c ,  
             v _ i t e m - > ' m o d i f i e r s '  
         ) ;  
  
         - -   3 .   D e d u c t   I n g r e d i e n t s   ( A t o m i c   S t o c k   M a n a g e m e n t )  
         F O R   v _ r e c i p e   I N    
             S E L E C T   i n g r e d i e n t _ i d ,   q u a n t i t y _ r e q u i r e d    
             F R O M   p u b l i c . p r o d u c t _ i n g r e d i e n t s    
             W H E R E   v a r i a n t _ i d   =   v _ v a r i a n t _ i d  
         L O O P  
             v _ i n g r e d i e n t _ d e d u c t i o n   : =   v _ r e c i p e . q u a n t i t y _ r e q u i r e d   *   v _ q u a n t i t y ;  
  
             U P D A T E   p u b l i c . i n g r e d i e n t s  
             S E T   c u r r e n t _ s t o c k   =   c u r r e n t _ s t o c k   -   v _ i n g r e d i e n t _ d e d u c t i o n  
             W H E R E   i d   =   v _ r e c i p e . i n g r e d i e n t _ i d ;  
              
             - -   O p t i o n a l :   L o g   w a s t a g e   o r   c h e c k   f o r   l o w   s t o c k   h e r e   i f   n e e d e d  
         E N D   L O O P ;  
  
         - -   4 .   D e d u c t   V a r i a n t   S t o c k   ( i f   t r a c k e d )  
         U P D A T E   p u b l i c . v a r i a n t s  
         S E T   s t o c k _ q u a n t i t y   =   s t o c k _ q u a n t i t y   -   v _ q u a n t i t y  
         W H E R E   i d   =   v _ v a r i a n t _ i d   A N D   t r a c k _ s t o c k   =   t r u e ;  
  
     E N D   L O O P ;  
  
     R E T U R N   j s o n b _ b u i l d _ o b j e c t (  
         ' s u c c e s s ' ,   t r u e ,  
         ' o r d e r _ i d ' ,   v _ o r d e r _ i d  
     ) ;  
 E X C E P T I O N   W H E N   O T H E R S   T H E N  
     R A I S E   E X C E P T I O N   ' T r a n s a c t i o n   f a i l e d :   % ' ,   S Q L E R R M ;  
 E N D ;  
 $ $ ;  
  
 - -   2 .   G i f t   C a r d   R e c h a r g e   R P C  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . i n c r e m e n t _ g i f t _ c a r d _ b a l a n c e ( c a r d _ i d   u u i d ,   a m o u n t   n u m e r i c )  
 R E T U R N S   v o i d  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 A S   $ $  
 B E G I N  
     U P D A T E   p u b l i c . g i f t _ c a r d s  
     S E T   c u r r e n t _ b a l a n c e   =   c u r r e n t _ b a l a n c e   +   a m o u n t ,  
             l a s t _ u s e d   =   N O W ( )  
     W H E R E   i d   =   c a r d _ i d ;  
 E N D ;  
 $ $ ;  
 - -   M i g r a t i o n :   C r e a t e   s e l l _ i t e m s   R P C   f o r   a t o m i c   t r a n s a c t i o n s   a n d   s t o c k   d e d u c t i o n  
 - -   A l s o   a d d s   i n c r e m e n t _ g i f t _ c a r d _ b a l a n c e   R P C  
  
 - -   1 .   C r e a t e   t y p e   f o r   o r d e r   i t e m   i n p u t   i f   n e e d e d ,   o r   j u s t   u s e   J S O N B  
 - -   W e   w i l l   u s e   J S O N B   f o r   f l e x i b i l i t y :    
 - -   p a y l o a d :   {    
 - -       b r a n c h I d :   u u i d ,    
 - -       t o t a l A m o u n t :   n u m b e r ,    
 - -       p a y m e n t M e t h o d :   t e x t ,    
 - -       c u s t o m e r I d :   u u i d   ( o p t i o n a l ) ,    
 - -       i t e m s :   [   {   v a r i a n t _ i d :   u u i d ,   q u a n t i t y :   n u m b e r ,   p r i c e :   n u m b e r ,   m o d i f i e r s :   [ ]   }   ]    
 - -   }  
  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . s e l l _ i t e m s ( o r d e r _ p a y l o a d   j s o n b )  
 R E T U R N S   j s o n b  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 A S   $ $  
 D E C L A R E  
     v _ o r d e r _ i d   u u i d ;  
     v _ i t e m   j s o n b ;  
     v _ v a r i a n t _ i d   u u i d ;  
     v _ q u a n t i t y   i n t ;  
     v _ t o t a l _ a m o u n t   n u m e r i c ;  
     v _ r e c i p e   r e c o r d ;  
     v _ i n g r e d i e n t _ d e d u c t i o n   n u m e r i c ;  
 B E G I N  
     - -   1 .   I n s e r t   O r d e r  
     I N S E R T   I N T O   p u b l i c . o r d e r s   (  
         b r a n c h _ i d ,  
         t o t a l _ a m o u n t ,  
         p a y m e n t _ m e t h o d ,  
         c u s t o m e r _ i d ,  
         c u s t o m e r _ n a m e ,  
         t a b l e _ n u m b e r ,  
         s t a t u s ,  
         c r e a t e d _ a t  
     )   V A L U E S   (  
         ( o r d e r _ p a y l o a d - > > ' b r a n c h I d ' ) : : u u i d ,  
         ( o r d e r _ p a y l o a d - > > ' t o t a l A m o u n t ' ) : : n u m e r i c ,  
         o r d e r _ p a y l o a d - > > ' p a y m e n t M e t h o d ' ,  
         ( o r d e r _ p a y l o a d - > > ' c u s t o m e r I d ' ) : : u u i d ,  
         o r d e r _ p a y l o a d - > > ' c u s t o m e r N a m e ' ,  
         o r d e r _ p a y l o a d - > > ' t a b l e N u m b e r ' ,  
         ' C O M P L E T E D ' ,  
         N O W ( )  
     )   R E T U R N I N G   i d   I N T O   v _ o r d e r _ i d ;  
  
     - -   2 .   P r o c e s s   I t e m s  
     F O R   v _ i t e m   I N   S E L E C T   *   F R O M   j s o n b _ a r r a y _ e l e m e n t s ( o r d e r _ p a y l o a d - > ' i t e m s ' )  
     L O O P  
         v _ v a r i a n t _ i d   : =   ( v _ i t e m - > > ' i d ' ) : : u u i d ;   - -   A s s u m i n g   ' i d '   m a t c h e s   v a r i a n t _ i d   i n   p a y l o a d  
         v _ q u a n t i t y   : =   ( v _ i t e m - > > ' q u a n t i t y ' ) : : i n t ;  
  
         - -   I n s e r t   O r d e r   I t e m  
         I N S E R T   I N T O   p u b l i c . o r d e r _ i t e m s   (  
             o r d e r _ i d ,  
             v a r i a n t _ i d ,  
             q u a n t i t y ,  
             p r i c e _ a t _ s a l e ,  
             m o d i f i e r s  
         )   V A L U E S   (  
             v _ o r d e r _ i d ,  
             v _ v a r i a n t _ i d ,  
             v _ q u a n t i t y ,  
             ( v _ i t e m - > > ' p r i c e ' ) : : n u m e r i c ,  
             v _ i t e m - > ' m o d i f i e r s '  
         ) ;  
  
         - -   3 .   D e d u c t   I n g r e d i e n t s   ( A t o m i c   S t o c k   M a n a g e m e n t )  
         F O R   v _ r e c i p e   I N    
             S E L E C T   i n g r e d i e n t _ i d ,   q u a n t i t y _ r e q u i r e d    
             F R O M   p u b l i c . p r o d u c t _ i n g r e d i e n t s    
             W H E R E   v a r i a n t _ i d   =   v _ v a r i a n t _ i d  
         L O O P  
             v _ i n g r e d i e n t _ d e d u c t i o n   : =   v _ r e c i p e . q u a n t i t y _ r e q u i r e d   *   v _ q u a n t i t y ;  
  
             U P D A T E   p u b l i c . i n g r e d i e n t s  
             S E T   c u r r e n t _ s t o c k   =   c u r r e n t _ s t o c k   -   v _ i n g r e d i e n t _ d e d u c t i o n  
             W H E R E   i d   =   v _ r e c i p e . i n g r e d i e n t _ i d ;  
              
             - -   O p t i o n a l :   L o g   w a s t a g e   o r   c h e c k   f o r   l o w   s t o c k   h e r e   i f   n e e d e d  
         E N D   L O O P ;  
  
         - -   4 .   D e d u c t   V a r i a n t   S t o c k   ( i f   t r a c k e d )  
         U P D A T E   p u b l i c . v a r i a n t s  
         S E T   s t o c k _ q u a n t i t y   =   s t o c k _ q u a n t i t y   -   v _ q u a n t i t y  
         W H E R E   i d   =   v _ v a r i a n t _ i d   A N D   t r a c k _ s t o c k   =   t r u e ;  
  
     E N D   L O O P ;  
  
     R E T U R N   j s o n b _ b u i l d _ o b j e c t (  
         ' s u c c e s s ' ,   t r u e ,  
         ' o r d e r _ i d ' ,   v _ o r d e r _ i d  
     ) ;  
 E X C E P T I O N   W H E N   O T H E R S   T H E N  
     R A I S E   E X C E P T I O N   ' T r a n s a c t i o n   f a i l e d :   % ' ,   S Q L E R R M ;  
 E N D ;  
 $ $ ;  
  
 - -   2 .   G i f t   C a r d   R e c h a r g e   R P C  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . i n c r e m e n t _ g i f t _ c a r d _ b a l a n c e ( c a r d _ i d   u u i d ,   a m o u n t   n u m e r i c )  
 R E T U R N S   v o i d  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 A S   $ $  
 B E G I N  
     U P D A T E   p u b l i c . g i f t _ c a r d s  
     S E T   c u r r e n t _ b a l a n c e   =   c u r r e n t _ b a l a n c e   +   a m o u n t ,  
             l a s t _ u s e d   =   N O W ( )  
     W H E R E   i d   =   c a r d _ i d ;  
 E N D ;  
 $ $ ;  
 - -   M i g r a t i o n :   C r e a t e   s e l l _ i t e m s   R P C   f o r   a t o m i c   t r a n s a c t i o n s   a n d   s t o c k   d e d u c t i o n  
 - -   A l s o   a d d s   i n c r e m e n t _ g i f t _ c a r d _ b a l a n c e   R P C  
  
 - -   1 .   C r e a t e   t y p e   f o r   o r d e r   i t e m   i n p u t   i f   n e e d e d ,   o r   j u s t   u s e   J S O N B  
 - -   W e   w i l l   u s e   J S O N B   f o r   f l e x i b i l i t y :    
 - -   p a y l o a d :   {    
 - -       b r a n c h I d :   u u i d ,    
 - -       t o t a l A m o u n t :   n u m b e r ,    
 - -       p a y m e n t M e t h o d :   t e x t ,    
 - -       c u s t o m e r I d :   u u i d   ( o p t i o n a l ) ,    
 - -       i t e m s :   [   {   v a r i a n t _ i d :   u u i d ,   q u a n t i t y :   n u m b e r ,   p r i c e :   n u m b e r ,   m o d i f i e r s :   [ ]   }   ]    
 - -   }  
  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . s e l l _ i t e m s ( o r d e r _ p a y l o a d   j s o n b )  
 R E T U R N S   j s o n b  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 A S   $ $  
 D E C L A R E  
     v _ o r d e r _ i d   u u i d ;  
     v _ i t e m   j s o n b ;  
     v _ v a r i a n t _ i d   u u i d ;  
     v _ q u a n t i t y   i n t ;  
     v _ t o t a l _ a m o u n t   n u m e r i c ;  
     v _ r e c i p e   r e c o r d ;  
     v _ i n g r e d i e n t _ d e d u c t i o n   n u m e r i c ;  
 B E G I N  
     - -   1 .   I n s e r t   O r d e r  
     I N S E R T   I N T O   p u b l i c . o r d e r s   (  
         b r a n c h _ i d ,  
         t o t a l _ a m o u n t ,  
         p a y m e n t _ m e t h o d ,  
         c u s t o m e r _ i d ,  
         c u s t o m e r _ n a m e ,  
         t a b l e _ n u m b e r ,  
         s t a t u s ,  
         c r e a t e d _ a t  
     )   V A L U E S   (  
         ( o r d e r _ p a y l o a d - > > ' b r a n c h I d ' ) : : u u i d ,  
         ( o r d e r _ p a y l o a d - > > ' t o t a l A m o u n t ' ) : : n u m e r i c ,  
         o r d e r _ p a y l o a d - > > ' p a y m e n t M e t h o d ' ,  
         ( o r d e r _ p a y l o a d - > > ' c u s t o m e r I d ' ) : : u u i d ,  
         o r d e r _ p a y l o a d - > > ' c u s t o m e r N a m e ' ,  
         o r d e r _ p a y l o a d - > > ' t a b l e N u m b e r ' ,  
         ' C O M P L E T E D ' ,  
         N O W ( )  
     )   R E T U R N I N G   i d   I N T O   v _ o r d e r _ i d ;  
  
     - -   2 .   P r o c e s s   I t e m s  
     F O R   v _ i t e m   I N   S E L E C T   *   F R O M   j s o n b _ a r r a y _ e l e m e n t s ( o r d e r _ p a y l o a d - > ' i t e m s ' )  
     L O O P  
         v _ v a r i a n t _ i d   : =   ( v _ i t e m - > > ' i d ' ) : : u u i d ;   - -   A s s u m i n g   ' i d '   m a t c h e s   v a r i a n t _ i d   i n   p a y l o a d  
         v _ q u a n t i t y   : =   ( v _ i t e m - > > ' q u a n t i t y ' ) : : i n t ;  
  
         - -   I n s e r t   O r d e r   I t e m  
         I N S E R T   I N T O   p u b l i c . o r d e r _ i t e m s   (  
             o r d e r _ i d ,  
             v a r i a n t _ i d ,  
             q u a n t i t y ,  
             p r i c e _ a t _ s a l e ,  
             m o d i f i e r s  
         )   V A L U E S   (  
             v _ o r d e r _ i d ,  
             v _ v a r i a n t _ i d ,  
             v _ q u a n t i t y ,  
             ( v _ i t e m - > > ' p r i c e ' ) : : n u m e r i c ,  
             v _ i t e m - > ' m o d i f i e r s '  
         ) ;  
  
         - -   3 .   D e d u c t   I n g r e d i e n t s   ( A t o m i c   S t o c k   M a n a g e m e n t )  
         F O R   v _ r e c i p e   I N    
             S E L E C T   i n g r e d i e n t _ i d ,   q u a n t i t y _ r e q u i r e d    
             F R O M   p u b l i c . p r o d u c t _ i n g r e d i e n t s    
             W H E R E   v a r i a n t _ i d   =   v _ v a r i a n t _ i d  
         L O O P  
             v _ i n g r e d i e n t _ d e d u c t i o n   : =   v _ r e c i p e . q u a n t i t y _ r e q u i r e d   *   v _ q u a n t i t y ;  
  
             U P D A T E   p u b l i c . i n g r e d i e n t s  
             S E T   c u r r e n t _ s t o c k   =   c u r r e n t _ s t o c k   -   v _ i n g r e d i e n t _ d e d u c t i o n  
             W H E R E   i d   =   v _ r e c i p e . i n g r e d i e n t _ i d ;  
              
             - -   O p t i o n a l :   L o g   w a s t a g e   o r   c h e c k   f o r   l o w   s t o c k   h e r e   i f   n e e d e d  
         E N D   L O O P ;  
  
         - -   4 .   D e d u c t   V a r i a n t   S t o c k   ( i f   t r a c k e d )  
         U P D A T E   p u b l i c . v a r i a n t s  
         S E T   s t o c k _ q u a n t i t y   =   s t o c k _ q u a n t i t y   -   v _ q u a n t i t y  
         W H E R E   i d   =   v _ v a r i a n t _ i d   A N D   t r a c k _ s t o c k   =   t r u e ;  
  
     E N D   L O O P ;  
  
     R E T U R N   j s o n b _ b u i l d _ o b j e c t (  
         ' s u c c e s s ' ,   t r u e ,  
         ' o r d e r _ i d ' ,   v _ o r d e r _ i d  
     ) ;  
 E X C E P T I O N   W H E N   O T H E R S   T H E N  
     R A I S E   E X C E P T I O N   ' T r a n s a c t i o n   f a i l e d :   % ' ,   S Q L E R R M ;  
 E N D ;  
 $ $ ;  
  
 - -   2 .   G i f t   C a r d   R e c h a r g e   R P C  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . i n c r e m e n t _ g i f t _ c a r d _ b a l a n c e ( c a r d _ c o d e   t e x t ,   a m o u n t   n u m e r i c )  
 R E T U R N S   v o i d  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 A S   $ $  
 B E G I N  
     U P D A T E   p u b l i c . g i f t _ c a r d s  
     S E T   b a l a n c e   =   b a l a n c e   +   a m o u n t ,  
             l a s t _ u s e d   =   N O W ( )  
     W H E R E   c o d e   =   c a r d _ c o d e ;  
 E N D ;  
 $ $ ;  
 