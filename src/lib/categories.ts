export type CategoryContent = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  benefits: string[];
  longCopy: string[];
  related: string[];
};

export const CATEGORIES: Record<string, CategoryContent> = {
  'quesos-frescos': {
    slug: 'quesos-frescos',
    title: 'Quesos frescos en Mosquera',
    metaTitle: 'Quesos frescos en Mosquera, Cundinamarca | Lácteos La Colina',
    metaDescription:
      'Quesos frescos en Mosquera, Cundinamarca: campesino, pera, mozzarella, doble crema y costeño. Producción diaria, sin conservantes, domicilio a Bogotá y la sabana.',
    h1: 'Quesos frescos en Mosquera, Cundinamarca',
    intro:
      'Selección diaria de quesos frescos elaborados con leche pasteurizada del altiplano cundiboyacense. Producción familiar con tradición de la sabana de Bogotá.',
    benefits: [
      'Producción diaria, sin conservantes',
      'Leche pasteurizada y cultivo láctico',
      'Domicilio el mismo día en Mosquera, Madrid y Funza',
      'Precios mayoristas para restaurantes y cafeterías',
    ],
    longCopy: [
      'En Lácteos La Colina seleccionamos cada mañana quesos frescos de proveedores locales del altiplano cundiboyacense. Trabajamos con marcas de la región y referencias nacionales para cubrir desde el tradicional queso campesino hasta opciones para pizza y gratinados.',
      'Nuestros quesos más pedidos en Mosquera y el occidente de Bogotá son el queso campesino pasteurizado en bloque (3.5 kg), el queso pera redondo de 454 g para sándwiches y hamburguesas, y la mozzarella fresca lista para pizza y lasaña. Si buscas queso para un negocio gastronómico, manejamos precios por volumen y entregas programadas.',
    ],
    related: ['queso campesino', 'queso pera', 'queso mozzarella', 'queso doble crema'],
  },
  'yogurt-y-kefir': {
    slug: 'yogurt-y-kefir',
    title: 'Yogurt y kéfir en Mosquera',
    metaTitle: 'Yogurt y kéfir natural en Mosquera, Cundinamarca | Lácteos La Colina',
    metaDescription:
      'Yogurt natural y de sabores, kéfir con probióticos y cuajada en Mosquera, Cundinamarca. Sin conservantes, presentación familiar de 1.1 a 1.75 L.',
    h1: 'Yogurt y kéfir natural en Mosquera, Cundinamarca',
    intro:
      'Yogurt batido, kéfir con probióticos y cuajada fresca, elaborados con leche pasteurizada y cultivo láctico. Sin azúcares añadidos ni conservantes.',
    benefits: [
      'Yogurt batido cremoso de 1.1 a 1.75 L',
      'Kéfir natural con probióticos para la flora intestinal',
      'Sin conservantes ni colorantes',
      'Apto para consumo diario y para preparar bebidas y postres',
    ],
    longCopy: [
      'Nuestra línea de yogurt incluye referencias naturales y de frutas (melocotón, frutos rojos, manzana y kiwi), en presentación familiar de 1.1 a 1.75 L. El kéfir natural es rico en probióticos y se entrega sin azúcar añadida, ideal para consumo diario.',
      'Si buscas yogur natural o kéfir para tu restaurante, cafetería o para un plan de alimentación saludable, escríbenos por WhatsApp y te enviamos la lista de precios actualizada.',
    ],
    related: ['yogurt natural', 'kéfir con probióticos', 'yogurt griego'],
  },
};
