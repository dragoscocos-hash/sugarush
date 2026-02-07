interface ProductData {
  name: string
  servingSize?: string
  carbs: number
  fiber: number
  sugar: number
  protein: number
  fat: number
  calories: number
  imageUrl?: string
}

export async function lookupBarcode(barcode: string): Promise<ProductData> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
  )

  if (!response.ok) {
    throw new Error('Product not found in database')
  }

  const data = await response.json()

  if (data.status !== 1) {
    throw new Error('Product not found')
  }

  const product = data.product
  const nutrients = product.nutriments || {}

  return {
    name: product.product_name || product.generic_name || 'Unknown Product',
    servingSize: product.serving_size || '100g',
    carbs: nutrients.carbohydrates_100g || nutrients.carbohydrates || 0,
    fiber: nutrients.fiber_100g || nutrients.fiber || 0,
    sugar: nutrients.sugars_100g || nutrients.sugars || 0,
    protein: nutrients.proteins_100g || nutrients.proteins || 0,
    fat: nutrients.fat_100g || nutrients.fat || 0,
    calories: nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || 0,
    imageUrl: product.image_url || product.image_front_url,
  }
}
