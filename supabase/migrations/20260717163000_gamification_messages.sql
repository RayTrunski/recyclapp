CREATE TABLE IF NOT EXISTS public.gamification_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type text NOT NULL,
  minimum_value integer NOT NULL DEFAULT 0,
  category text NOT NULL
    CHECK (category IN ('impact', 'achievement', 'next_step')),
  title text NOT NULL,
  message text NOT NULL,
  badge_code text,
  active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS gamification_messages_event_idx
  ON public.gamification_messages (event_type, category, minimum_value);

INSERT INTO public.gamification_messages (
  event_type,
  minimum_value,
  category,
  title,
  message,
  badge_code
)
VALUES
  (
    'items_published',
    1,
    'impact',
    'Impacto',
    'Tus {{count}} {{publication_word}} ya están generando movimiento circular en la comunidad.',
    null
  ),
  (
    'reused_items',
    1,
    'impact',
    'Impacto',
    'Has dado una segunda oportunidad a {{count}} {{article_word}} y evitado su descarte prematuro.',
    null
  ),
  (
    'completed_deliveries',
    1,
    'impact',
    'Impacto',
    'Ya completaste {{count}} {{delivery_word}} dentro de ReCyClapp y coordinaste intercambios reales entre usuarios.',
    null
  ),
  (
    'shared_locations',
    1,
    'impact',
    'Impacto',
    'Has compartido tu ubicación {{count}} {{location_share_word}} para hacer más precisas las entregas.',
    null
  ),
  (
    'items_published',
    1,
    'achievement',
    'Primer paso',
    'Creaste tu primera publicación y activaste tu huella circular en ReCyClapp.',
    'FIRST_STEP'
  ),
  (
    'completed_deliveries',
    1,
    'achievement',
    'Primer intercambio',
    'Completaste tu primera entrega y diste una segunda vida a un artículo.',
    'FIRST_EXCHANGE'
  ),
  (
    'completed_deliveries',
    3,
    'achievement',
    'Reutilizador activo',
    'Ya completaste tres intercambios dentro de ReCyClapp.',
    'ACTIVE_REUSER'
  ),
  (
    'shared_locations',
    1,
    'achievement',
    'Coordinación en tiempo real',
    'Compartiste tu primera ubicación en el chat para coordinar una entrega.',
    'LIVE_COORDINATOR'
  ),
  (
    'reused_items',
    3,
    'achievement',
    'Segunda vida',
    'Recuperaste al menos tres artículos dentro de la plataforma.',
    'SECOND_LIFE'
  ),
  (
    'profile_completion',
    100,
    'achievement',
    'Perfil listo',
    'Completaste la información clave de tu cuenta para coordinar mejor cada entrega.',
    'PROFILE_READY'
  ),
  (
    'active_days',
    3,
    'achievement',
    'Constancia circular',
    'Mantuviste actividad durante tres días distintos en la plataforma.',
    'ECO_STREAK'
  ),
  (
    'appliance_publications',
    1,
    'achievement',
    'Rescate de línea blanca',
    'Publicaste tu primer electrodoméstico para extender su vida útil.',
    'APPLIANCE_RESCUER'
  ),
  (
    'items_published',
    1,
    'next_step',
    'Comienza tu impacto',
    'Crea tu primera publicación para desbloquear la insignia Primer paso.',
    null
  ),
  (
    'completed_deliveries',
    1,
    'next_step',
    'Siguiente reto',
    'Completa tu primera entrega para obtener la insignia Primer intercambio.',
    null
  ),
  (
    'completed_deliveries',
    3,
    'next_step',
    'Siguiente reto',
    'Completa {{remaining}} {{remaining_delivery_word}} más para desbloquear Reutilizador activo.',
    null
  ),
  (
    'shared_locations',
    1,
    'next_step',
    'Coordinación',
    'Comparte tu ubicación en un chat para desbloquear Coordinación en tiempo real.',
    null
  ),
  (
    'reused_items',
    3,
    'next_step',
    'Segunda vida en progreso',
    'Recupera {{remaining}} {{remaining_article_word}} más para desbloquear Segunda vida.',
    null
  ),
  (
    'profile_completion',
    100,
    'next_step',
    'Perfil pendiente',
    'Completa los datos de tu cuenta para desbloquear la insignia {{badge_name}}.',
    null
  ),
  (
    'active_days',
    3,
    'next_step',
    'Constancia',
    'Vuelve durante {{remaining}} {{remaining_day_word}} más para desbloquear Constancia circular.',
    null
  ),
  (
    'appliance_publications',
    1,
    'next_step',
    'Electrodoméstico pendiente',
    'Publica un electrodoméstico para desbloquear la insignia Rescate de línea blanca.',
    null
  )
ON CONFLICT DO NOTHING;
