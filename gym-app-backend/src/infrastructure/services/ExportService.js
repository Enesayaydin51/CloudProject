const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = require('docx');

class ExportService {
  /**
   * Haftalık beslenme planını Word dosyasına dönüştürür
   */
  async exportToWord(weeklyPlan, userName = 'Kullanıcı') {
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    
    // Doküman içeriği
    const children = [];

    // Başlık
    children.push(
      new Paragraph({
        text: 'Haftalık Beslenme Planı',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Kullanıcı bilgisi
    children.push(
      new Paragraph({
        text: `Hazırlanan: ${userName}`,
        spacing: { after: 200 }
      })
    );

    // Tarih
    children.push(
      new Paragraph({
        text: `Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
        spacing: { after: 400 }
      })
    );

    // Haftalık özet
    if (weeklyPlan.weeklySummary) {
      children.push(
        new Paragraph({
          text: 'Haftalık Özet',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      const summaryText = [
        `Toplam Kalori: ${weeklyPlan.weeklySummary.totalCalories || 'N/A'}`,
        `Günlük Ortalama Kalori: ${weeklyPlan.weeklySummary.averageDailyCalories || 'N/A'}`,
        `Günlük Ortalama Protein: ${weeklyPlan.weeklySummary.averageDailyProtein || 'N/A'}`,
        `Günlük Ortalama Karbonhidrat: ${weeklyPlan.weeklySummary.averageDailyCarb || 'N/A'}`,
        `Günlük Ortalama Yağ: ${weeklyPlan.weeklySummary.averageDailyFat || 'N/A'}`
      ].join('\n');

      children.push(
        new Paragraph({
          text: summaryText,
          spacing: { after: 400 }
        })
      );
    }

    // Her gün için plan
    if (weeklyPlan.week && Array.isArray(weeklyPlan.week)) {
      weeklyPlan.week.forEach((day, index) => {
        // Gün başlığı
        children.push(
          new Paragraph({
            text: `${day.day || days[index] || `Gün ${index + 1}`}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          })
        );

        // Günlük makro bilgileri
        const dayMacros = [
          `Kalori: ${day.dailyCalories || 'N/A'}`,
          `Protein: ${day.protein || 'N/A'}`,
          `Karbonhidrat: ${day.carb || 'N/A'}`,
          `Yağ: ${day.fat || 'N/A'}`
        ].join(' | ');

        children.push(
          new Paragraph({
            text: dayMacros,
            spacing: { after: 200 }
          })
        );

        // Öğünler tablosu
        if (day.meals && Array.isArray(day.meals) && day.meals.length > 0) {
          const tableRows = [
            // Başlık satırı
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('Öğün')],
                  width: { size: 20, type: WidthType.PERCENTAGE }
                }),
                new TableCell({
                  children: [new Paragraph('Saat')],
                  width: { size: 15, type: WidthType.PERCENTAGE }
                }),
                new TableCell({
                  children: [new Paragraph('İçerik')],
                  width: { size: 40, type: WidthType.PERCENTAGE }
                }),
                new TableCell({
                  children: [new Paragraph('Kalori')],
                  width: { size: 25, type: WidthType.PERCENTAGE }
                })
              ]
            })
          ];

          // Öğün satırları
          day.meals.forEach(meal => {
            const items = Array.isArray(meal.items) 
              ? meal.items.join(', ') 
              : (meal.items || 'N/A');

            tableRows.push(
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph(meal.title || 'Öğün')]
                  }),
                  new TableCell({
                    children: [new Paragraph(meal.time || 'N/A')]
                  }),
                  new TableCell({
                    children: [new Paragraph(items)]
                  }),
                  new TableCell({
                    children: [new Paragraph(
                      meal.calories 
                        ? `${meal.calories} kcal` 
                        : 'N/A'
                    )]
                  })
                ]
              })
            );
          });

          children.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE }
            })
          );
        }

        children.push(
          new Paragraph({
            text: '',
            spacing: { after: 300 }
          })
        );
      });
    }

    // Öneriler
    if (weeklyPlan.recommendations) {
      children.push(
        new Paragraph({
          text: 'Öneriler',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      children.push(
        new Paragraph({
          text: weeklyPlan.recommendations,
          spacing: { after: 400 }
        })
      );
    }

    // Doküman oluştur
    const doc = new Document({
      sections: [{
        children: children
      }]
    });

    // Buffer'a dönüştür
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }

  /**
   * Planı JSON formatında döndürür
   */
  exportToJson(weeklyPlan) {
    return JSON.stringify(weeklyPlan, null, 2);
  }
}

module.exports = ExportService;

