-- =====================================================
-- Quesos La Colina – Seed de productos de ejemplo
-- =====================================================
-- Imágenes: ilustraciones SVG locales en /public/images/products/
-- Cuando subas fotos reales al bucket "products" de Supabase,
-- reemplaza image_url por la URL pública del storage.

insert into public.products (name, slug, short_description, description, image_url, category, price, display_order, is_active) values
  (
    'Queso Mozzarella La Colina',
    'queso-mozzarella',
    'Mozzarella fresca, suave y elástica. Ideal para pizza, lasaña y caprese.',
    'Nuestra mozzarella se elabora con leche pasteurizada y se estira a mano siguiendo la técnica artesanal italiana. Perfecta para derretir sobre pizza, gratinar lasañas o preparar una caprese fresca. Textura fibrosa, sabor delicado y frescura del altiplano cundinamarqués en cada pieza.',
    '/images/products/mozza.svg',
    'Quesos',
    13500,
    1,
    true
  ),
  (
    'Queso Cheddar La Colina',
    'queso-cheddar',
    'Cheddar madurado con sabor intenso. Perfecto para nachos, hamburguesas y sándwiches.',
    'Queso cheddar madurado durante semanas en nuestras cavas de Mosquera, con notas marcadas a frutos secos y un color amarillo intenso. Se derrite de manera uniforme, por eso es la elección favorita para hamburguesas, nachos, gratinados y tablas de queso.',
    '/images/products/cheddar.svg',
    'Quesos',
    15800,
    2,
    true
  ),
  (
    'Quesillo',
    'quesillo',
    'Quesillo artesanal suave y fibroso. Ideal para desayunos y postres.',
    'Nuestro quesillo es una receta tradicional de la sabana: leche entera, cuajo natural y un proceso lento de hilado que le da su textura característica. Se disfruta con bocadillo, en arepas o como ingrediente dulce en postres caseros.',
    '/images/products/quesillo.svg',
    'Quesos',
    9800,
    3,
    true
  ),
  (
    'Queso Doble Crema',
    'queso-doble-crema',
    'Cremoso y untuoso, con alto contenido de grasa. Perfecto para arepas y tablas.',
    'Queso fresco de alta humedad y doble crema, untuoso y de sabor suave con notas lácteas. Acompáñalo con arepas calentitas, pan artesanal o sírvelo en una tabla con frutas y miel. Se conserva bien refrigerado hasta por 10 días.',
    '/images/products/doble-crema.svg',
    'Quesos',
    12500,
    4,
    true
  ),
  (
    'Queso Costeño',
    'queso-costeno',
    'Queso costeño tradicional, salado y firme. Acompañante del patacón y la changua.',
    'Receta tradicional del Caribe colombiano con salazón en punto: textura firme, sabor intenso y esa personalidad única del queso costeño. Ideal para patacones, changua, suero costeño o simplemente para comer con una buena arepa.',
    '/images/products/costeno.svg',
    'Quesos',
    11200,
    5,
    true
  ),
  (
    'Queso Semidescremado',
    'queso-semidescremado',
    'Versión ligera con menos grasa pero igual de sabor. Ideal para alimentación balanceada.',
    'Elaborado con leche semidescremada y los mismos cuidados artesanales de la casa, este queso conserva todo el sabor con un menor contenido de grasa. Perfecto para sándwiches, ensaladas y recetas saludables.',
    '/images/products/semidescremado.svg',
    'Quesos Light',
    11500,
    6,
    true
  ),
  (
    'Queso Campesino',
    'queso-campesino',
    'Receta campesina de la sabana, fresco, suave y de sabor profundo.',
    'Nuestra receta más auténtica: un queso fresco estilo campesino, hecho en pequeñas tandas con leche del altiplano. Textura ligeramente desmoronable, sabor profundo y un toque salino muy balanceado. Perfecto con café, pan o en una buena sopa.',
    '/images/products/campesino.svg',
    'Quesos',
    10500,
    7,
    true
  ),
  (
    'Yogurt Natural La Colina',
    'yogurt-natural',
    'Yogurt natural cremoso, sin azúcar añadida. Hecho con leche fresca local.',
    'Yogurt batido de forma artesanal con leche entera de nuestra red de productores. Sin azúcar añadida, sin conservantes y con el sabor real de la leche fresca de la sabana. Textura cremosa y un toque ligeramente ácido que lo hace ideal para el desayuno.',
    '/images/products/yogurt-natural.svg',
    'Yogurt',
    6500,
    8,
    true
  ),
  (
    'Yogurt de Fresa La Colina',
    'yogurt-fresa',
    'Yogurt batido con pulpa de fresa real. Refrescante y para cualquier momento del día.',
    'Yogurt cremoso mezclado con pulpa de fresa seleccionada. Endulzado justo para sentirse fresco sin empalagar. Perfecto como merienda, postre o para llevar en el camino. Sin colorantes artificiales.',
    '/images/products/yogurt-fresa.svg',
    'Yogurt',
    7500,
    9,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  image_url = excluded.image_url,
  category = excluded.category,
  price = excluded.price,
  display_order = excluded.display_order,
  is_active = excluded.is_active;
