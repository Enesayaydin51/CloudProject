/**
 * Haftalık AI beslenme planı: besin satırlarını { name, quantity, unit, calories, caloriesPerUnit? } biçimine getirir,
 * miktar değişince kaloriyi orantılı günceller. caloriesPerUnit: miktar 0 iken de birim kaloriyi hatırlamak için.
 */

function parseStringFoodItem(str) {
  const t = String(str).trim();
  const m = t.match(
    /^(\d+(?:[.,]\d+)?)\s*(adet|Adet|g|G|gram|ml|mL|dilim|Dilim|bardak|Bardak|porsiyon|Porsiyon|kase|Kase|yaprak|Yaprak)?\s+(.+)$/i
  );
  if (m) {
    const qty = parseFloat(String(m[1]).replace(",", "."));
    const unit = (m[2] || "adet").trim();
    const name = (m[3] || "").trim();
    return { name: name || t, quantity: Number.isFinite(qty) && qty >= 0 ? qty : 1, unit: unit || "adet", calories: 0 };
  }
  return { name: t, quantity: 1, unit: "porsiyon", calories: 0 };
}

function normalizeMeal(meal) {
  const rawItems = meal.items || [];
  const mealCal = Number(meal.calories) || 0;
  const items = rawItems.map((it) => {
    if (it && typeof it === "object" && it.name != null) {
      const qty = parseFloat(it.quantity);
      const quantity = Number.isFinite(qty) && qty >= 0 ? qty : 1;
      const cal = Number(it.calories);
      const calories = Number.isFinite(cal) && cal >= 0 ? Math.round(cal) : 0;
      const out = {
        name: String(it.name).trim(),
        quantity,
        unit: String(it.unit || "adet").trim(),
        calories,
      };
      const existingCpu = Number(it.caloriesPerUnit);
      if (Number.isFinite(existingCpu) && existingCpu >= 0) {
        out.caloriesPerUnit = existingCpu;
      } else if (quantity > 0) {
        out.caloriesPerUnit = calories / quantity;
      }
      return out;
    }
    if (typeof it === "string") {
      return parseStringFoodItem(it);
    }
    return { name: "?", quantity: 1, unit: "porsiyon", calories: 0 };
  });
  const hasItemCals = items.some((i) => i.calories > 0);
  if (!hasItemCals && mealCal > 0 && items.length > 0) {
    const per = Math.max(1, Math.round(mealCal / items.length));
    items.forEach((i) => {
      i.calories = per;
      if (i.quantity > 0) {
        i.caloriesPerUnit = per / i.quantity;
      }
    });
  }
  const sumItems = items.reduce((s, i) => s + i.calories, 0);
  return {
    ...meal,
    items,
    calories: meal.calories != null && meal.calories !== "" ? Number(meal.calories) : sumItems,
  };
}

const WEEK_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

/**
 * Planın week alanındaki tüm öğünleri yapılandırılmış besin satırlarına dönüştürür.
 */
export function normalizeNutritionPlan(plan) {
  if (!plan || !plan.week) return plan;
  const week = { ...plan.week };
  WEEK_DAYS.forEach((day) => {
    const dayData = week[day];
    if (!dayData?.meals) return;
    week[day] = {
      ...dayData,
      meals: dayData.meals.map((m) => normalizeMeal(m)),
    };
  });
  return { ...plan, week };
}

/**
 * Bir besin satırında miktar değişince kaloriyi birim başına orantılı günceller; öğün toplamını yeniden hesaplar.
 */
export function updateMealLineQuantity(plan, dayKey, mealIndex, itemIndex, quantityText) {
  const raw = String(quantityText).replace(",", ".").trim();
  if (!plan?.week?.[dayKey]?.meals?.[mealIndex]?.items?.[itemIndex]) return plan;
  const qNew = parseFloat(raw);
  if (!Number.isFinite(qNew) || qNew < 0) return plan;

  const next = JSON.parse(JSON.stringify(plan));
  const item = next.week[dayKey].meals[mealIndex].items[itemIndex];
  const oldQ = parseFloat(item.quantity);
  const oldC = parseFloat(item.calories) || 0;

  let perUnit = Number(item.caloriesPerUnit);
  if (!Number.isFinite(perUnit) || perUnit < 0) {
    perUnit = Number.isFinite(oldQ) && oldQ > 0 ? oldC / oldQ : 0;
  }

  if (qNew === 0) {
    item.quantity = 0;
    item.calories = 0;
    if (Number.isFinite(perUnit) && perUnit >= 0) {
      item.caloriesPerUnit = perUnit;
    }
  } else {
    item.quantity = qNew;
    item.calories = Math.max(0, Math.round(perUnit * qNew));
    if (Number.isFinite(perUnit) && perUnit >= 0) {
      item.caloriesPerUnit = perUnit;
    } else if (qNew > 0 && item.calories > 0) {
      item.caloriesPerUnit = item.calories / qNew;
    }
  }

  const meal = next.week[dayKey].meals[mealIndex];
  meal.calories = meal.items.reduce((s, i) => s + (Number(i.calories) || 0), 0);
  return next;
}

/** Görüntü: nesne veya ham string */
export function mealItemDisplayLine(item) {
  if (item == null) return "";
  if (typeof item === "string") return item;
  const u = item.unit ? ` ${item.unit}` : "";
  return `${item.name} · ${item.quantity}${u}`.trim();
}
