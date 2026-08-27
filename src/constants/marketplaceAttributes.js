export const PAPER_FAMILIES = [
  { family: 'Uncoated Offset', subTypes: ['Natural', 'Smooth', 'Textured'], weights: [70, 80, 100, 115, 150, 200], finishes: ['Uncoated', 'Textured'], sizes: ['A4', 'A3', '27.6 x 39.4 inches'] },
  { family: 'Coated Art', subTypes: ['Gloss', 'Matte', 'Silk'], weights: [115, 150, 200, 250, 300, 350], finishes: ['Matte', 'Gloss', 'Silk', 'Soft-touch'], sizes: ['A4', 'A3', '27.6 x 39.4 inches', '33.1 x 46.8 inches'] },
  { family: 'Specialty Paper', subTypes: ['Kraft', 'NCR', 'Textured'], weights: [80, 100, 120, 150, 200, 250], finishes: ['Textured', 'Uncoated'], sizes: ['A4', 'A3'] },
  { family: 'Board & Packaging', subTypes: ['Cardstock', 'Folding Box Board', 'Corrugated'], weights: [200, 250, 300, 350], finishes: ['Matte', 'Gloss', 'Textured'], sizes: ['A3', '27.6 x 39.4 inches', '33.1 x 46.8 inches'] },
  { family: 'Photo Paper', subTypes: ['Gloss', 'Matte', 'Lustre'], weights: [180, 200, 250], finishes: ['Gloss', 'Matte', 'Soft-touch'], sizes: ['A4', 'A3'] },
  { family: 'Label Paper', subTypes: ['Gloss', 'Matte', 'Clear'], weights: [80, 100, 150, 200], finishes: ['Gloss', 'Matte', 'Uncoated'], sizes: ['A4', 'A3'] },
  { family: 'Synthetic Paper', subTypes: ['PP', 'PET'], weights: [100, 150, 200], finishes: ['Matte', 'Gloss', 'Soft-touch'], sizes: ['A4', 'A3'] }
];

export const FINISHES = ['Matte', 'Gloss', 'Silk', 'Soft-touch', 'Textured', 'Uncoated'];
export const PAPER_SIZES = ['A4', 'A3', '33.1 x 46.8 inches', '27.6 x 39.4 inches'];
export const PRINT_USE_CASES = ['Books', 'Brochures', 'Flyers', 'Magazines', 'Catalogs', 'Wedding Invitations', 'Certificates', 'Packaging', 'Labels'];

export const PAPER_STOCKS = PAPER_FAMILIES.map(({ family }) => family);
export const PAPER_WEIGHTS = Object.fromEntries(PAPER_FAMILIES.map(({ family, weights }) => [family, weights.map(weight => `${weight}gsm`)]));

export const MARKETPLACE_TEMPLATES = PAPER_FAMILIES.map((paper, index) => {
  const useCase = paper.family === 'Photo Paper'
    ? 'Photos'
    : paper.family === 'Board & Packaging' || paper.family === 'Specialty Paper'
      ? 'Packaging'
      : paper.family === 'Label Paper' || paper.family === 'Synthetic Paper'
        ? 'Labels'
        : paper.family === 'Coated Art'
          ? 'Brochures'
          : 'Books';

  return {
    id: `template-${index + 1}`,
    name: `${paper.subTypes[0]} ${paper.family} Paper`,
    gsm: paper.weights[0],
    paperFamily: paper.family,
    paperSubType: paper.subTypes[0],
    finish: paper.finishes[0],
    paperSize: paper.sizes[0],
    printUseCase: useCase,
    useCases: [useCase],
    price: 15000 + index * 2500,
    quantity: 250,
    minOrderQuantity: 1,
    delivery: 'Yes',
    merchant_id: 'merchant-template',
    merchant_name: 'Printers Companion Starter Catalog',
    merchant_rating: 5
  };
});

export const PRODUCT_CATEGORIES = [
  'Business Printing',
  'Marketing Materials',
  'Packaging',
  'Stationery',
  'Photo Printing',
  'Books and Documents'
];

export const PRINTING_TYPES = ['Single Side', 'Double Side'];
export const COLOR_OPTIONS = ['Black & White', 'Full Color'];
export const PRICE_UNITS = ['Per Piece', 'Per Pack', 'Per 100 Copies', 'Custom Quote'];
export const CURRENCIES = ['NGN', 'GHS', 'USD'];