/**
 * Demo product catalog for Lucky Traders.
 *
 * Each entry is a *seed*: one seed expands into one product per pack size, so
 * this file produces 250+ products. Prices are in LKR and are representative
 * of a Sri Lankan neighbourhood grocery - the owner edits them from the admin
 * panel after go-live.
 *
 * Fields:
 *   n     product base name (English)
 *   si/ta Sinhala / Tamil name
 *   cat   parent category slug     sub  subcategory slug
 *   b     brand name               d    description
 *   sizes [unit label, price] pairs
 *   sale  optional discount percentage applied to every size
 *   tags  optional flags: 'featured' | 'new' | 'best'
 */

export const productSeeds = [
  // ---------------------------------------------------------------- Rice & Grains
  { n: 'Nadu Rice', si: 'නාඩු හාල්', ta: 'நாடு அரிசி', cat: 'rice-grains', sub: 'nadu-rice', b: 'Araliya', d: 'Premium quality Nadu rice with a firm grain - the everyday choice for rice and curry.', sizes: [['1kg', 285], ['5kg', 1390], ['10kg', 2740]], sale: 8, tags: ['featured', 'best'] },
  { n: 'Nadu Rice', si: 'නාඩු හාල්', ta: 'நாடு அரிசி', cat: 'rice-grains', sub: 'nadu-rice', b: 'Nipuna', d: 'Cleanly milled Nadu rice, sorted and packed for household use.', sizes: [['5kg', 1320], ['10kg', 2590]] },
  { n: 'Samba Rice', si: 'සම්බා හාල්', ta: 'சம்பா அரிசி', cat: 'rice-grains', sub: 'samba-rice', b: 'Araliya', d: 'Short-grain Samba rice, ideal for a traditional rice and curry meal.', sizes: [['1kg', 310], ['5kg', 1490], ['10kg', 2950]], tags: ['best'] },
  { n: 'Keeri Samba Rice', si: 'කීරි සම්බා හාල්', ta: 'கீரி சம்பா அரிசி', cat: 'rice-grains', sub: 'keeri-samba', b: 'Rathna', d: 'Fine Keeri Samba - fragrant, soft and perfect for milk rice.', sizes: [['1kg', 375], ['5kg', 1840]], sale: 6, tags: ['featured'] },
  { n: 'Red Raw Rice', si: 'රතු කැකුළු හාල්', ta: 'சிவப்பு பச்சை அரிசி', cat: 'rice-grains', sub: 'red-rice', b: 'CIC', d: 'Traditional red raw rice, high in fibre and full of flavour.', sizes: [['1kg', 295], ['5kg', 1440]] },
  { n: 'White Raw Rice', si: 'සුදු කැකුළු හාල්', ta: 'வெள்ளை பச்சை அரிசி', cat: 'rice-grains', sub: 'white-rice', b: 'CIC', d: 'Clean white raw rice suitable for daily cooking.', sizes: [['5kg', 1385], ['10kg', 2720]] },
  { n: 'Basmati Rice', si: 'බාස්මතී හාල්', ta: 'பாஸ்மதி அரிசி', cat: 'rice-grains', sub: 'basmati-rice', b: 'Fortune', d: 'Long-grain aromatic basmati for biriyani and fried rice.', sizes: [['1kg', 745], ['5kg', 3590]], tags: ['new'] },
  { n: 'Brown Rice', si: 'දුඹුරු හාල්', ta: 'பழுப்பு அரிசி', cat: 'rice-grains', sub: 'brown-rice', b: 'Serendib', d: 'Unpolished brown rice - a healthier everyday option.', sizes: [['1kg', 340], ['5kg', 1650]] },
  { n: 'Wheat Flour', si: 'තිරිඟු පිටි', ta: 'கோதுமை மாவு', cat: 'rice-grains', sub: 'wheat-flour', b: 'Prima', d: 'All-purpose wheat flour for roti, bread and short eats.', sizes: [['1kg', 275], ['2kg', 535]], sale: 9, tags: ['best'] },
  { n: 'Atta Flour', si: 'ආටා පිටි', ta: 'ஆட்டா மாவு', cat: 'rice-grains', sub: 'wheat-flour', b: 'Prima', d: 'Whole wheat atta flour, stone ground for soft roti.', sizes: [['1kg', 295]] },
  { n: 'Rice Flour', si: 'හාල් පිටි', ta: 'அரிசி மாவு', cat: 'rice-grains', sub: 'wheat-flour', b: 'Harischandra', d: 'Finely milled rice flour for hoppers and pittu.', sizes: [['400g', 210], ['1kg', 480]] },
  { n: 'Kurakkan Flour', si: 'කුරක්කන් පිටි', ta: 'கேழ்வரகு மாவு', cat: 'rice-grains', sub: 'kurakkan', b: 'Harischandra', d: 'Nutritious finger millet flour for thalapa and porridge.', sizes: [['400g', 265], ['1kg', 620]] },
  { n: 'Corn Flour', si: 'ඉරිඟු පිටි', ta: 'சோள மாவு', cat: 'rice-grains', sub: 'corn-flour', b: 'Motha', d: 'Smooth corn flour for thickening gravies and desserts.', sizes: [['200g', 175], ['500g', 395]] },
  { n: 'Semolina (Rulang)', si: 'රුලං', ta: 'ரவை', cat: 'rice-grains', sub: 'semolina-oats', b: 'Motha', d: 'Coarse semolina for upma, halwa and sweets.', sizes: [['500g', 330], ['1kg', 620]] },
  { n: 'Rolled Oats', si: 'ඕට්ස්', ta: 'ஓட்ஸ்', cat: 'rice-grains', sub: 'semolina-oats', b: 'Serendib', d: 'Wholegrain rolled oats - a quick, filling breakfast.', sizes: [['500g', 690], ['1kg', 1290]], sale: 10 },

  // ---------------------------------------------------------------- Dhal & Pulses
  { n: 'Red Dhal (Mysore)', si: 'රතු පරිප්පු', ta: 'சிவப்பு பருப்பு', cat: 'dhal-pulses', sub: 'red-dhal', b: 'CIC', d: 'Everyday Mysore dhal that cooks quickly into a creamy curry.', sizes: [['500g', 385], ['1kg', 735]], sale: 7, tags: ['best', 'featured'] },
  { n: 'Green Gram', si: 'මුං ඇට', ta: 'பாசிப்பயறு', cat: 'dhal-pulses', sub: 'green-gram', b: 'CIC', d: 'Whole green gram for kiribath accompaniments and sprouts.', sizes: [['500g', 590], ['1kg', 1140]] },
  { n: 'Chickpeas (Kadala)', si: 'කඩල', ta: 'கொண்டைக்கடலை', cat: 'dhal-pulses', sub: 'chickpeas', b: 'CIC', d: 'Dried chickpeas for boiled kadala and curries.', sizes: [['500g', 520], ['1kg', 990]] },
  { n: 'Cowpea', si: 'මෑ ඇට', ta: 'காராமணி', cat: 'dhal-pulses', sub: 'cowpea', b: 'Nipuna', d: 'Dried cowpea, a breakfast favourite with coconut sambol.', sizes: [['500g', 545], ['1kg', 1050]] },
  { n: 'Black Gram (Ulundu)', si: 'උඳු', ta: 'உளுந்து', cat: 'dhal-pulses', sub: 'black-gram', b: 'Nipuna', d: 'Whole black gram for vadai and thosai batter.', sizes: [['500g', 690]] },
  { n: 'Toor Dhal', si: 'තෝර පරිප්පු', ta: 'துவரம் பருப்பு', cat: 'dhal-pulses', sub: 'lentils', b: 'Fortune', d: 'Split pigeon peas for sambar and dhal curry.', sizes: [['500g', 610], ['1kg', 1180]] },
  { n: 'Soya Meat', si: 'සෝයා මීට්', ta: 'சோயா இறைச்சி', cat: 'dhal-pulses', sub: 'soya', b: 'Raigam', d: 'Textured soya protein - a budget-friendly meat substitute.', sizes: [['90g', 145], ['250g', 365]], tags: ['best'] },

  // ---------------------------------------------------------------- Sugar & Sweeteners
  { n: 'White Sugar', si: 'සුදු සීනි', ta: 'வெள்ளை சர்க்கரை', cat: 'sugar-sweeteners', sub: 'white-sugar', b: 'Pelwatte', d: 'Fine white granulated sugar for tea and baking.', sizes: [['1kg', 295], ['5kg', 1425]], tags: ['best'] },
  { n: 'Brown Sugar', si: 'දුඹුරු සීනි', ta: 'பழுப்பு சர்க்கரை', cat: 'sugar-sweeteners', sub: 'brown-sugar', b: 'Pelwatte', d: 'Unrefined brown sugar with a light molasses flavour.', sizes: [['500g', 265], ['1kg', 495]] },
  { n: 'Kithul Jaggery', si: 'කිතුල් හකුරු', ta: 'கித்துல் வெல்லம்', cat: 'sugar-sweeteners', sub: 'jaggery', b: 'Krish', d: 'Traditional kithul jaggery blocks - pure and unrefined.', sizes: [['250g', 480], ['500g', 890]], tags: ['featured'] },
  { n: 'Coconut Treacle', si: 'පොල් පැණි', ta: 'தேங்காய் பாகு', cat: 'sugar-sweeteners', sub: 'treacle', b: 'Krish', d: 'Natural coconut treacle for curd, pancakes and desserts.', sizes: [['350ml', 640], ['750ml', 1250]] },
  { n: 'Icing Sugar', si: 'අයිසිං සීනි', ta: 'ஐசிங் சர்க்கரை', cat: 'sugar-sweeteners', sub: 'icing-sugar', b: 'Motha', d: 'Powdered icing sugar for cake decoration.', sizes: [['200g', 245]] },

  // ---------------------------------------------------------------- Cooking Essentials
  { n: 'Coconut Oil', si: 'පොල් තෙල්', ta: 'தேங்காய் எண்ணெய்', cat: 'cooking-essentials', sub: 'coconut-oil', b: 'Marina', d: 'Pure white coconut oil, the everyday Sri Lankan cooking oil.', sizes: [['400ml', 590], ['750ml', 1090], ['1L', 1420]], sale: 8, tags: ['featured', 'best'] },
  { n: 'Virgin Coconut Oil', si: 'වර්ජින් පොල් තෙල්', ta: 'வர்ஜின் தேங்காய் எண்ணெய்', cat: 'cooking-essentials', sub: 'coconut-oil', b: 'Krish', d: 'Cold-pressed virgin coconut oil for cooking and hair care.', sizes: [['400ml', 980]], tags: ['new'] },
  { n: 'Vegetable Cooking Oil', si: 'එළවළු තෙල්', ta: 'காய்கறி எண்ணெய்', cat: 'cooking-essentials', sub: 'vegetable-oil', b: 'Marina', d: 'Light, neutral vegetable oil for frying and baking.', sizes: [['500ml', 640], ['1L', 1240]] },
  { n: 'Palm Oil', si: 'තල් තෙල්', ta: 'பாம் எண்ணெய்', cat: 'cooking-essentials', sub: 'palm-olive-oil', b: 'Marina', d: 'Refined palm oil for deep frying.', sizes: [['1L', 1090]] },
  { n: 'Olive Oil', si: 'ඔලිව් තෙල්', ta: 'ஆலிவ் எண்ணெய்', cat: 'cooking-essentials', sub: 'palm-olive-oil', b: 'Diva', d: 'Extra virgin olive oil for salads and light cooking.', sizes: [['250ml', 1450], ['500ml', 2690]] },
  { n: 'Ghee', si: 'ගිතෙල්', ta: 'நெய்', cat: 'cooking-essentials', sub: 'ghee', b: 'Anchor', d: 'Rich cooking ghee for biriyani, sweets and tempering.', sizes: [['200g', 990], ['400g', 1850]] },
  { n: 'White Vinegar', si: 'සුදු විනාකිරි', ta: 'வெள்ளை வினிகர்', cat: 'cooking-essentials', sub: 'vinegar', b: 'MD', d: 'Clear white vinegar for pickles and cooking.', sizes: [['350ml', 165], ['750ml', 285]] },
  { n: 'Table Salt', si: 'මේස ලුණු', ta: 'மேசை உப்பு', cat: 'cooking-essentials', sub: 'salt', b: 'Raigam', d: 'Iodised fine table salt.', sizes: [['400g', 95], ['1kg', 185]], tags: ['best'] },
  { n: 'Coarse Sea Salt', si: 'මුහුදු ලුණු', ta: 'கடல் உப்பு', cat: 'cooking-essentials', sub: 'salt', b: 'Raigam', d: 'Coarse sea salt for curries and preserving.', sizes: [['1kg', 165]] },
  { n: 'Baking Powder', si: 'බේකින් පවුඩර්', ta: 'பேக்கிங் பவுடர்', cat: 'cooking-essentials', sub: 'baking', b: 'Motha', d: 'Double-acting baking powder for cakes and buns.', sizes: [['100g', 195]] },
  { n: 'Baking Soda', si: 'බේකින් සෝඩා', ta: 'பேக்கிங் சோடா', cat: 'cooking-essentials', sub: 'baking', b: 'Motha', d: 'Pure bicarbonate of soda for baking and cleaning.', sizes: [['100g', 145]] },
  { n: 'Instant Dry Yeast', si: 'යීස්ට්', ta: 'ஈஸ்ட்', cat: 'cooking-essentials', sub: 'baking', b: 'Motha', d: 'Instant dry yeast for bread and buns.', sizes: [['50g', 210]] },

  // ---------------------------------------------------------------- Spices
  { n: 'Chili Powder', si: 'මිරිස් කුඩු', ta: 'மிளகாய் தூள்', cat: 'spices', sub: 'chili', b: 'MD', d: 'Bright, aromatic chili powder ground from quality dried chilies.', sizes: [['100g', 265], ['250g', 620], ['500g', 1190]], sale: 7, tags: ['best'] },
  { n: 'Chili Pieces', si: 'මිරිස් කැබලි', ta: 'மிளகாய் துண்டுகள்', cat: 'spices', sub: 'chili', b: 'MD', d: 'Crushed chili flakes for tempering and sambols.', sizes: [['100g', 285], ['250g', 665]] },
  { n: 'Turmeric Powder', si: 'කහ කුඩු', ta: 'மஞ்சள் தூள்', cat: 'spices', sub: 'turmeric', b: 'MD', d: 'Pure turmeric powder with a deep golden colour.', sizes: [['50g', 130], ['100g', 235], ['250g', 545]], tags: ['best'] },
  { n: 'Curry Powder (Unroasted)', si: 'තුනපහ', ta: 'கறி தூள்', cat: 'spices', sub: 'curry-powder', b: 'Larich', d: 'Balanced unroasted curry powder for vegetable and fish curries.', sizes: [['50g', 145], ['100g', 265]] },
  { n: 'Roasted Curry Powder', si: 'බැදපු තුනපහ', ta: 'வறுத்த கறி தூள்', cat: 'spices', sub: 'curry-powder', b: 'Larich', d: 'Dark roasted curry powder for meat and black pork curry.', sizes: [['50g', 165], ['100g', 295]], tags: ['featured'] },
  { n: 'Black Pepper Powder', si: 'ගම්මිරිස් කුඩු', ta: 'மிளகு தூள்', cat: 'spices', sub: 'pepper', b: 'MD', d: 'Freshly ground Ceylon black pepper.', sizes: [['50g', 385], ['100g', 725]] },
  { n: 'Ceylon Cinnamon Sticks', si: 'කුරුඳු', ta: 'இலவங்கப்பட்டை', cat: 'spices', sub: 'cinnamon-cardamom', b: 'Krish', d: 'True Ceylon cinnamon quills, sweet and delicate.', sizes: [['50g', 420], ['100g', 790]], tags: ['featured'] },
  { n: 'Cardamom', si: 'එනසාල්', ta: 'ஏலக்காய்', cat: 'spices', sub: 'cinnamon-cardamom', b: 'Krish', d: 'Whole green cardamom pods.', sizes: [['25g', 690], ['50g', 1320]] },
  { n: 'Cloves', si: 'කරාබුනැටි', ta: 'கிராம்பு', cat: 'spices', sub: 'whole-spices', b: 'Krish', d: 'Whole cloves for curries and tea.', sizes: [['50g', 490]] },
  { n: 'Fennel Seeds', si: 'මාදුරු', ta: 'பெருஞ்சீரகம்', cat: 'spices', sub: 'whole-spices', b: 'MD', d: 'Sweet fennel seeds for tempering and tea.', sizes: [['100g', 275]] },
  { n: 'Cumin Seeds', si: 'සූදුරු', ta: 'சீரகம்', cat: 'spices', sub: 'whole-spices', b: 'MD', d: 'Aromatic cumin seeds.', sizes: [['100g', 320]] },
  { n: 'Coriander Powder', si: 'කොත්තමල්ලි කුඩු', ta: 'கொத்தமல்லி தூள்', cat: 'spices', sub: 'whole-spices', b: 'Larich', d: 'Ground coriander, the base of every curry powder.', sizes: [['100g', 245], ['250g', 570]] },
  { n: 'Mustard Seeds', si: 'අබ', ta: 'கடுகு', cat: 'spices', sub: 'whole-spices', b: 'MD', d: 'Small black mustard seeds for tempering.', sizes: [['100g', 210]] },
  { n: 'Fenugreek', si: 'උළුහාල්', ta: 'வெந்தயம்', cat: 'spices', sub: 'whole-spices', b: 'MD', d: 'Fenugreek seeds for fish curry and tempering.', sizes: [['100g', 185]] },
  { n: 'Tamarind', si: 'සියඹලා', ta: 'புளி', cat: 'spices', sub: 'tamarind-goraka', b: 'Krish', d: 'Seedless tamarind pulp for sour curries.', sizes: [['200g', 340], ['500g', 790]] },
  { n: 'Goraka', si: 'ගොරකා', ta: 'கோரக்கா', cat: 'spices', sub: 'tamarind-goraka', b: 'Krish', d: 'Dried goraka for authentic fish ambul thiyal.', sizes: [['100g', 295]] },

  // ---------------------------------------------------------------- Tea & Coffee
  { n: 'Ceylon Black Tea', si: 'තේ කොළ', ta: 'தேயிலை', cat: 'tea-coffee', sub: 'tea', b: 'Zesta', d: 'Strong Ceylon black tea leaves for a full-bodied cup.', sizes: [['200g', 490], ['400g', 940]], sale: 10, tags: ['best', 'featured'] },
  { n: 'Premium Ceylon Tea', si: 'උසස් තේ කොළ', ta: 'உயர்தர தேயிலை', cat: 'tea-coffee', sub: 'tea', b: 'Dilmah', d: 'Single-origin Ceylon tea, garden fresh.', sizes: [['200g', 690], ['400g', 1320]] },
  { n: 'Tea Bags', si: 'තේ බෑග්', ta: 'தேநீர் பைகள்', cat: 'tea-coffee', sub: 'tea-bags', b: 'Dilmah', d: 'Convenient tagged tea bags for a quick cup.', sizes: [['25 bags', 460], ['100 bags', 1590]] },
  { n: 'Green Tea Bags', si: 'හරිත තේ බෑග්', ta: 'பச்சை தேநீர் பைகள்', cat: 'tea-coffee', sub: 'green-tea', b: 'Mlesna', d: 'Pure Ceylon green tea bags.', sizes: [['25 bags', 690]], tags: ['new'] },
  { n: 'Instant Coffee', si: 'ක්ෂණික කෝපි', ta: 'உடனடி காபி', cat: 'tea-coffee', sub: 'coffee', b: 'Nescafe', d: 'Classic instant coffee granules.', sizes: [['50g', 690], ['100g', 1290]], sale: 6 },
  { n: 'Ground Coffee', si: 'කෝපි කුඩු', ta: 'காபி தூள்', cat: 'tea-coffee', sub: 'coffee', b: 'Serendib', d: 'Medium-roast Sri Lankan ground coffee.', sizes: [['200g', 1150]] },
  { n: 'Full Cream Milk Powder', si: 'කිරි පිටි', ta: 'பால் பவுடர்', cat: 'tea-coffee', sub: 'milk-powder', b: 'Anchor', d: 'Full cream milk powder for tea, coffee and cooking.', sizes: [['400g', 1290], ['1kg', 2990]], tags: ['best', 'featured'] },
  { n: 'Full Cream Milk Powder', si: 'කිරි පිටි', ta: 'பால் பவுடர்', cat: 'tea-coffee', sub: 'milk-powder', b: 'Highland', d: 'Locally produced full cream milk powder.', sizes: [['400g', 1240], ['1kg', 2890]], sale: 5 },
  { n: 'Malted Milk Drink', si: 'නෙස්ටොමෝල්ට්', ta: 'மால்ட் பானம்', cat: 'tea-coffee', sub: 'milk-powder', b: 'Nestomalt', d: 'Malted milk food drink for the whole family.', sizes: [['400g', 990]] },
  { n: 'Chocolate Malt Drink', si: 'මයිලෝ', ta: 'மைலோ', cat: 'tea-coffee', sub: 'milk-powder', b: 'Milo', d: 'Chocolate malt energy drink powder.', sizes: [['400g', 1190]] },

  // ---------------------------------------------------------------- Beverages
  { n: 'Cream Soda', si: 'ක්‍රීම් සෝඩා', ta: 'கிரீம் சோடா', cat: 'beverages', sub: 'soft-drinks', b: 'Elephant House', d: 'Sri Lanka\'s favourite cream soda.', sizes: [['400ml', 130], ['1.5L', 390]], tags: ['best'] },
  { n: 'Ginger Beer', si: 'ජින්ජර් බියර්', ta: 'ஜின்ஜர் பீர்', cat: 'beverages', sub: 'soft-drinks', b: 'Elephant House', d: 'Classic non-alcoholic ginger beer.', sizes: [['400ml', 140], ['1.5L', 420]] },
  { n: 'Cola', si: 'කෝලා', ta: 'கோலா', cat: 'beverages', sub: 'soft-drinks', b: 'Coca-Cola', d: 'Chilled cola, best served with ice.', sizes: [['400ml', 150], ['1.5L', 440]] },
  { n: 'Mixed Fruit Nectar', si: 'මිශ්‍ර පළතුරු නෙක්ටාර්', ta: 'கலவை பழ நெக்டர்', cat: 'beverages', sub: 'fruit-drinks', b: 'MD', d: 'Real fruit nectar with no artificial colours.', sizes: [['200ml', 110], ['1L', 480]] },
  { n: 'Wood Apple Nectar', si: 'දිවුල් නෙක්ටාර්', ta: 'விளாம்பழ நெக்டர்', cat: 'beverages', sub: 'fruit-drinks', b: 'MD', d: 'Traditional wood apple drink.', sizes: [['1L', 520]], tags: ['new'] },
  { n: 'Energy Drink', si: 'ශක්ති පානය', ta: 'எனர்ஜி பானம்', cat: 'beverages', sub: 'energy-drinks', b: 'Elephant House', d: 'Carbonated energy drink with taurine and caffeine.', sizes: [['250ml', 240]] },
  { n: 'Drinking Water', si: 'බීම වතුර', ta: 'குடிநீர்', cat: 'beverages', sub: 'bottled-water', b: 'Keells', d: 'Purified bottled drinking water.', sizes: [['500ml', 70], ['1.5L', 130], ['5L', 320]], tags: ['best'] },
  { n: 'Orange Cordial', si: 'දොඩම් කෝඩියල්', ta: 'ஆரஞ்சு கார்டியல்', cat: 'beverages', sub: 'cordials-syrups', b: 'Sunquick', d: 'Concentrated orange cordial - dilute to taste.', sizes: [['700ml', 1290]], sale: 12 },
  { n: 'Faluda Syrup', si: 'ෆලූඩා සිරප්', ta: 'ஃபலூடா சிரப்', cat: 'beverages', sub: 'cordials-syrups', b: 'MD', d: 'Rose syrup for faluda and cold drinks.', sizes: [['750ml', 590]] },

  // ---------------------------------------------------------------- Biscuits & Snacks
  { n: 'Cream Cracker', si: 'ක්‍රීම් ක්‍රැකර්', ta: 'கிரீம் கிராக்கர்', cat: 'biscuits-snacks', sub: 'crackers', b: 'Maliban', d: 'Light, crisp cream crackers - great with tea or cheese.', sizes: [['190g', 210], ['500g', 520]], tags: ['best'] },
  { n: 'Marie Biscuits', si: 'මාරි බිස්කට්', ta: 'மேரி பிஸ்கட்', cat: 'biscuits-snacks', sub: 'crackers', b: 'Maliban', d: 'Classic light Marie biscuits.', sizes: [['200g', 195], ['400g', 380]] },
  { n: 'Chocolate Cream Biscuits', si: 'චොකලට් ක්‍රීම් බිස්කට්', ta: 'சாக்லேட் கிரீம் பிஸ்கட்', cat: 'biscuits-snacks', sub: 'cream-biscuits', b: 'Munchee', d: 'Sandwich biscuits with a rich chocolate cream filling.', sizes: [['100g', 165], ['400g', 590]], sale: 10 },
  { n: 'Custard Cream Biscuits', si: 'කස්ටඩ් ක්‍රීම් බිස්කට්', ta: 'கஸ்டர்ட் கிரீம் பிஸ்கட்', cat: 'biscuits-snacks', sub: 'cream-biscuits', b: 'Munchee', d: 'Vanilla custard cream sandwich biscuits.', sizes: [['100g', 160], ['400g', 570]] },
  { n: 'Chocolate Chip Cookies', si: 'චොකලට් චිප් කුකීස්', ta: 'சாக்லேட் சிப் குக்கீஸ்', cat: 'biscuits-snacks', sub: 'cookies-wafers', b: 'Ceylon Biscuits', d: 'Buttery cookies loaded with chocolate chips.', sizes: [['170g', 340]], tags: ['new'] },
  { n: 'Wafer Sticks', si: 'වේෆර් ස්ටික්ස්', ta: 'வேஃபர் ஸ்டிக்ஸ்', cat: 'biscuits-snacks', sub: 'cookies-wafers', b: 'Tiara', d: 'Crisp wafer rolls with cream filling.', sizes: [['125g', 290]] },
  { n: 'Potato Chips', si: 'අර්තාපල් චිප්ස්', ta: 'உருளைக்கிழங்கு சிப்ஸ்', cat: 'biscuits-snacks', sub: 'chips', b: 'Uswatte', d: 'Crunchy salted potato chips.', sizes: [['40g', 130], ['100g', 280]], tags: ['best'] },
  { n: 'Manioc Chips', si: 'මඤ්ඤොක්කා චිප්ස්', ta: 'மரவள்ளி சிப்ஸ்', cat: 'biscuits-snacks', sub: 'chips', b: 'Uswatte', d: 'Traditional spicy manioc chips.', sizes: [['80g', 260]] },
  { n: 'Cashew Nuts', si: 'කජු', ta: 'முந்திரி', cat: 'biscuits-snacks', sub: 'nuts-mixture', b: 'Krish', d: 'Roasted and salted whole cashews.', sizes: [['100g', 890], ['250g', 2150]], tags: ['featured'] },
  { n: 'Bombay Mixture', si: 'මික්ස්චර්', ta: 'மிக்சர்', cat: 'biscuits-snacks', sub: 'nuts-mixture', b: 'Uswatte', d: 'Spicy savoury mixture with nuts and sev.', sizes: [['100g', 210], ['250g', 480]] },
  { n: 'Milk Chocolate Bar', si: 'කිරි චොකලට්', ta: 'பால் சாக்லேட்', cat: 'biscuits-snacks', sub: 'chocolates-candy', b: 'Ritzbury', d: 'Smooth Sri Lankan milk chocolate.', sizes: [['45g', 195], ['100g', 420]], sale: 8 },
  { n: 'Fruit Jelly Crystals', si: 'ජෙලි', ta: 'ஜெல்லி', cat: 'biscuits-snacks', sub: 'chocolates-candy', b: 'Motha', d: 'Fruit-flavoured jelly crystals - just add hot water.', sizes: [['100g', 165]] },
  { n: 'Toffee Candy Pack', si: 'ටොෆි', ta: 'டாஃபி', cat: 'biscuits-snacks', sub: 'chocolates-candy', b: 'Ritzbury', d: 'Assorted chewy toffees.', sizes: [['200g', 380]] },

  // ---------------------------------------------------------------- Breakfast
  { n: 'Corn Flakes', si: 'කෝන් ෆ්ලේක්ස්', ta: 'கார்ன் ஃப்ளேக்ஸ்', cat: 'breakfast', sub: 'cereals', b: 'Nestle', d: 'Crisp golden corn flakes - serve with cold milk.', sizes: [['275g', 890], ['475g', 1420]], sale: 8 },
  { n: 'Choco Cereal', si: 'චොකලට් සිරියල්', ta: 'சாக்லேட் சீரியல்', cat: 'breakfast', sub: 'cereals', b: 'Nestle', d: 'Chocolate-flavoured cereal shells kids love.', sizes: [['300g', 1090]] },
  { n: 'Mixed Fruit Jam', si: 'මිශ්‍ර පළතුරු ජෑම්', ta: 'கலவை பழ ஜாம்', cat: 'breakfast', sub: 'jam-honey', b: 'MD', d: 'Mixed fruit jam made with real fruit pulp.', sizes: [['200g', 340], ['500g', 690]], tags: ['best'] },
  { n: 'Wood Apple Jam', si: 'දිවුල් ජෑම්', ta: 'விளாம்பழ ஜாம்', cat: 'breakfast', sub: 'jam-honey', b: 'MD', d: 'Traditional wood apple jam.', sizes: [['500g', 720]] },
  { n: 'Bee Honey', si: 'මී පැණි', ta: 'தேன்', cat: 'breakfast', sub: 'jam-honey', b: 'Krish', d: 'Pure natural bee honey.', sizes: [['250g', 1150], ['500g', 2190]], tags: ['featured'] },
  { n: 'Peanut Butter', si: 'රටකජු බටර්', ta: 'வேர்க்கடலை வெண்ணெய்', cat: 'breakfast', sub: 'spreads', b: 'MD', d: 'Creamy peanut butter with no added palm oil.', sizes: [['200g', 590], ['400g', 1090]] },
  { n: 'Chocolate Spread', si: 'චොකලට් ස්ප්‍රෙඩ්', ta: 'சாக்லேட் ஸ்ப்ரெட்', cat: 'breakfast', sub: 'spreads', b: 'Tiara', d: 'Hazelnut chocolate spread for bread and pancakes.', sizes: [['200g', 790]], tags: ['new'] },

  // ---------------------------------------------------------------- Canned & Packaged
  { n: 'Canned Tuna in Oil', si: 'ටින් ටූනා', ta: 'கேன் சூரை மீன்', cat: 'canned-packaged', sub: 'canned-fish', b: 'Marina', d: 'Tuna chunks in sunflower oil.', sizes: [['185g', 640]], tags: ['best'] },
  { n: 'Canned Sardines in Tomato', si: 'ටින් සාඩින්', ta: 'கேன் மத்தி', cat: 'canned-packaged', sub: 'canned-fish', b: 'Alli', d: 'Sardines in a rich tomato sauce.', sizes: [['155g', 460], ['425g', 990]], sale: 7, tags: ['best'] },
  { n: 'Canned Mackerel', si: 'ටින් බලයා', ta: 'கேன் கானாங்கெளுத்தி', cat: 'canned-packaged', sub: 'canned-fish', b: 'Alli', d: 'Mackerel in tomato sauce - a pantry staple.', sizes: [['425g', 940]] },
  { n: 'Canned Pineapple Slices', si: 'ටින් අන්නාසි', ta: 'கேன் அன்னாசி', cat: 'canned-packaged', sub: 'canned-fruit-veg', b: 'Kist', d: 'Pineapple slices in light syrup.', sizes: [['565g', 690]] },
  { n: 'Baked Beans', si: 'බේක්ඩ් බීන්ස්', ta: 'பேக்ட் பீன்ஸ்', cat: 'canned-packaged', sub: 'canned-fruit-veg', b: 'Kist', d: 'Beans in tomato sauce - ready to heat and serve.', sizes: [['420g', 540]] },
  { n: 'Tomato Sauce', si: 'තක්කාලි සෝස්', ta: 'தக்காளி சாஸ்', cat: 'canned-packaged', sub: 'sauces', b: 'MD', d: 'Thick tomato sauce made from ripe tomatoes.', sizes: [['400g', 490], ['1kg', 1090]], tags: ['best'] },
  { n: 'Chili Sauce', si: 'චිලි සෝස්', ta: 'சில்லி சாஸ்', cat: 'canned-packaged', sub: 'sauces', b: 'MD', d: 'Hot and tangy chili sauce.', sizes: [['400g', 470]] },
  { n: 'Soy Sauce', si: 'සෝයා සෝස්', ta: 'சோயா சாஸ்', cat: 'canned-packaged', sub: 'sauces', b: 'MD', d: 'Dark soy sauce for stir fries and fried rice.', sizes: [['350ml', 420]] },
  { n: 'Mayonnaise', si: 'මෙයොනීස්', ta: 'மயோனைஸ்', cat: 'canned-packaged', sub: 'mayo-mustard', b: 'MD', d: 'Creamy mayonnaise for sandwiches and salads.', sizes: [['200g', 420], ['400g', 790]], sale: 6 },
  { n: 'Mustard Sauce', si: 'අබ සෝස්', ta: 'கடுகு சாஸ்', cat: 'canned-packaged', sub: 'mayo-mustard', b: 'MD', d: 'Smooth mustard sauce.', sizes: [['200g', 390]] },

  // ---------------------------------------------------------------- Noodles & Pasta
  { n: 'Instant Noodles - Chicken', si: 'ක්ෂණික නූඩ්ල්ස් - චිකන්', ta: 'உடனடி நூடுல்ஸ் - சிக்கன்', cat: 'noodles-pasta', sub: 'instant-noodles', b: 'Maggi', d: 'Two-minute chicken flavoured instant noodles.', sizes: [['73g', 110], ['5 pack', 520]], tags: ['best', 'featured'] },
  { n: 'Instant Noodles - Devilled', si: 'ක්ෂණික නූඩ්ල්ස් - දෙවිල්', ta: 'உடனடி நூடுல்ஸ் - டெவில்', cat: 'noodles-pasta', sub: 'instant-noodles', b: 'Prima Kottu', d: 'Spicy devilled flavour instant noodles.', sizes: [['80g', 120], ['5 pack', 560]] },
  { n: 'Egg Noodles', si: 'බිත්තර නූඩ්ල්ස්', ta: 'முட்டை நூடுல்ஸ்', cat: 'noodles-pasta', sub: 'instant-noodles', b: 'Prima', d: 'Dried egg noodles for chow mein and soups.', sizes: [['400g', 390]] },
  { n: 'String Hopper Flour (White)', si: 'ඉඳිආප්ප පිටි', ta: 'இடியப்ப மாவு', cat: 'noodles-pasta', sub: 'string-hopper-flour', b: 'Harischandra', d: 'Ready-to-use white string hopper flour.', sizes: [['700g', 420], ['1kg', 580]], tags: ['best'] },
  { n: 'String Hopper Flour (Red)', si: 'රතු ඉඳිආප්ප පිටි', ta: 'சிவப்பு இடியப்ப மாவு', cat: 'noodles-pasta', sub: 'string-hopper-flour', b: 'Harischandra', d: 'Red rice string hopper flour, higher in fibre.', sizes: [['700g', 450]] },
  { n: 'Penne Pasta', si: 'පැස්ටා', ta: 'பாஸ்தா', cat: 'noodles-pasta', sub: 'pasta', b: 'Prima', d: 'Durum wheat penne pasta.', sizes: [['400g', 450]] },
  { n: 'Spaghetti', si: 'ස්පැගටි', ta: 'ஸ்பாகெட்டி', cat: 'noodles-pasta', sub: 'pasta', b: 'Prima', d: 'Classic long spaghetti.', sizes: [['400g', 440]] },
  { n: 'Macaroni', si: 'මැකරෝනි', ta: 'மக்கரோனி', cat: 'noodles-pasta', sub: 'pasta', b: 'Prima', d: 'Elbow macaroni for pasta bakes and salads.', sizes: [['400g', 420]] },

  // ---------------------------------------------------------------- Dairy & Chilled
  { n: 'Fresh Milk', si: 'නැවුම් කිරි', ta: 'புதிய பால்', cat: 'dairy-chilled', sub: 'milk', b: 'Ambewela', d: 'Pasteurised fresh cow milk.', sizes: [['500ml', 340], ['1L', 640]], tags: ['best'] },
  { n: 'UHT Milk', si: 'UHT කිරි', ta: 'UHT பால்', cat: 'dairy-chilled', sub: 'milk', b: 'Ambewela', d: 'Long-life UHT milk - no refrigeration until opened.', sizes: [['1L', 690]] },
  { n: 'Set Yoghurt', si: 'යෝගට්', ta: 'தயிர்', cat: 'dairy-chilled', sub: 'yogurt-curd', b: 'Kotmale', d: 'Creamy set yoghurt cups.', sizes: [['80g', 90], ['4 pack', 340]] },
  { n: 'Buffalo Curd', si: 'මී කිරි', ta: 'எருமை தயிர்', cat: 'dairy-chilled', sub: 'yogurt-curd', b: 'Lucky Lanka', d: 'Traditional buffalo curd in a clay pot.', sizes: [['400g', 490]], tags: ['featured'] },
  { n: 'Cheddar Cheese', si: 'චෙඩාර් චීස්', ta: 'செடார் சீஸ்', cat: 'dairy-chilled', sub: 'cheese-butter', b: 'Happy Cow', d: 'Processed cheddar cheese slices.', sizes: [['200g', 890]] },
  { n: 'Butter (Salted)', si: 'බටර්', ta: 'வெண்ணெய்', cat: 'dairy-chilled', sub: 'cheese-butter', b: 'Anchor', d: 'Salted dairy butter for toast and baking.', sizes: [['227g', 1090]], sale: 5 },
  { n: 'Margarine', si: 'මාගරින්', ta: 'மார்கரின்', cat: 'dairy-chilled', sub: 'cheese-butter', b: 'Astra', d: 'Vegetable margarine for spreading and baking.', sizes: [['250g', 490], ['500g', 890]] },

  // ---------------------------------------------------------------- Frozen
  { n: 'Frozen Chicken (Whole)', si: 'ශීතකළ කුකුල් මස්', ta: 'உறைந்த முழு கோழி', cat: 'frozen', sub: 'frozen-meat', b: 'Keells', d: 'Cleaned whole broiler chicken, frozen fresh.', sizes: [['1kg', 1290]], tags: ['best'] },
  { n: 'Frozen Chicken Sausages', si: 'ශීතකළ සොසේජස්', ta: 'உறைந்த சாசேஜ்', cat: 'frozen', sub: 'frozen-meat', b: 'Keells', d: 'Chicken sausages - grill, fry or add to rice.', sizes: [['400g', 890]] },
  { n: 'Frozen Mixed Vegetables', si: 'ශීතකළ මිශ්‍ර එළවළු', ta: 'உறைந்த கலவை காய்கறிகள்', cat: 'frozen', sub: 'frozen-veg', b: 'Keells', d: 'Peas, carrot and beans, ready to cook.', sizes: [['400g', 540]] },
  { n: 'Frozen Samosa', si: 'ශීතකළ සමෝසා', ta: 'உறைந்த சமோசா', cat: 'frozen', sub: 'frozen-snacks', b: 'Keells', d: 'Vegetable samosas - deep fry from frozen.', sizes: [['10 pack', 690]] },
  { n: 'Vanilla Ice Cream', si: 'වැනිලා අයිස්ක්‍රීම්', ta: 'வெனிலா ஐஸ்கிரீம்', cat: 'frozen', sub: 'ice-cream', b: 'Elephant House', d: 'Classic vanilla ice cream tub.', sizes: [['1L', 990]], sale: 10, tags: ['featured'] },
  { n: 'Chocolate Ice Cream', si: 'චොකලට් අයිස්ක්‍රීම්', ta: 'சாக்லேட் ஐஸ்கிரீம்', cat: 'frozen', sub: 'ice-cream', b: 'Elephant House', d: 'Rich chocolate ice cream tub.', sizes: [['1L', 1040]] },

  // ---------------------------------------------------------------- Fresh Produce
  { n: 'Big Onions', si: 'ලොකු ලූනු', ta: 'பெரிய வெங்காயம்', cat: 'fresh-produce', sub: 'vegetables', b: '', d: 'Imported big onions, sold by weight.', sizes: [['500g', 195], ['1kg', 370]], tags: ['best'] },
  { n: 'Red Onions', si: 'රතු ලූනු', ta: 'சிவப்பு வெங்காயம்', cat: 'fresh-produce', sub: 'vegetables', b: '', d: 'Local red onions for tempering and sambol.', sizes: [['500g', 340]] },
  { n: 'Potatoes', si: 'අර්තාපල්', ta: 'உருளைக்கிழங்கு', cat: 'fresh-produce', sub: 'vegetables', b: '', d: 'Fresh potatoes, washed and graded.', sizes: [['1kg', 420]] },
  { n: 'Tomatoes', si: 'තක්කාලි', ta: 'தக்காளி', cat: 'fresh-produce', sub: 'vegetables', b: '', d: 'Firm ripe tomatoes.', sizes: [['500g', 240]] },
  { n: 'Carrots', si: 'කැරට්', ta: 'கேரட்', cat: 'fresh-produce', sub: 'vegetables', b: '', d: 'Upcountry carrots, crisp and sweet.', sizes: [['500g', 265]] },
  { n: 'Green Chilies', si: 'අමු මිරිස්', ta: 'பச்சை மிளகாய்', cat: 'fresh-produce', sub: 'vegetables', b: '', d: 'Fresh green chilies.', sizes: [['250g', 190]] },
  { n: 'Gotukola', si: 'ගොටුකොළ', ta: 'வல்லாரை', cat: 'fresh-produce', sub: 'leafy', b: '', d: 'Fresh gotukola bunch for sambol and porridge.', sizes: [['1 bunch', 120]] },
  { n: 'Mukunuwenna', si: 'මුකුණුවැන්න', ta: 'பொன்னாங்கண்ணி', cat: 'fresh-produce', sub: 'leafy', b: '', d: 'Fresh mukunuwenna leaves.', sizes: [['1 bunch', 110]] },
  { n: 'Bananas (Ambul)', si: 'ඇඹුල් කෙසෙල්', ta: 'அம்புல் வாழைப்பழம்', cat: 'fresh-produce', sub: 'fruits', b: '', d: 'Sweet-sour ambul bananas.', sizes: [['1kg', 340]], tags: ['best'] },
  { n: 'Papaya', si: 'ගස්ලබු', ta: 'பப்பாளி', cat: 'fresh-produce', sub: 'fruits', b: '', d: 'Ripe red papaya.', sizes: [['1 piece', 290]] },
  { n: 'Pineapple', si: 'අන්නාසි', ta: 'அன்னாசி', cat: 'fresh-produce', sub: 'fruits', b: '', d: 'Sweet local pineapple.', sizes: [['1 piece', 390]] },
  { n: 'Fresh Coconut', si: 'පොල්', ta: 'தேங்காய்', cat: 'fresh-produce', sub: 'coconut-eggs', b: '', d: 'Whole fresh coconut for scraping and milk.', sizes: [['1 piece', 190], ['3 pieces', 540]], tags: ['best', 'featured'] },
  { n: 'Eggs (White)', si: 'බිත්තර', ta: 'முட்டை', cat: 'fresh-produce', sub: 'coconut-eggs', b: '', d: 'Farm fresh white eggs.', sizes: [['6 pack', 350], ['10 pack', 570]], tags: ['best'] },

  // ---------------------------------------------------------------- Meat & Seafood
  { n: 'Chicken Curry Cut', si: 'කුකුල් මස් කරි කට්', ta: 'கோழி கறி துண்டு', cat: 'meat-seafood', sub: 'chicken', b: '', d: 'Fresh chicken cut into curry-size pieces.', sizes: [['500g', 720], ['1kg', 1390]], tags: ['best'] },
  { n: 'Chicken Breast', si: 'කුකුල් මස් පියයුරු', ta: 'கோழி மார்பு', cat: 'meat-seafood', sub: 'chicken', b: '', d: 'Boneless skinless chicken breast fillets.', sizes: [['500g', 1090]] },
  { n: 'Beef Curry Cut', si: 'හරක් මස්', ta: 'மாட்டிறைச்சி', cat: 'meat-seafood', sub: 'red-meat', b: '', d: 'Fresh beef, cut for curry.', sizes: [['1kg', 2290]] },
  { n: 'Mutton Curry Cut', si: 'එළු මස්', ta: 'ஆட்டிறைச்சி', cat: 'meat-seafood', sub: 'red-meat', b: '', d: 'Fresh mutton with bone, curry cut.', sizes: [['1kg', 3290]] },
  { n: 'Kelawalla (Tuna) Steaks', si: 'කෙළවල්ලා', ta: 'கெளவல்லா', cat: 'meat-seafood', sub: 'fish-prawns', b: '', d: 'Fresh yellowfin tuna steaks.', sizes: [['500g', 1290]], tags: ['featured'] },
  { n: 'Prawns (Medium)', si: 'ඉස්සන්', ta: 'இறால்', cat: 'meat-seafood', sub: 'fish-prawns', b: '', d: 'Cleaned medium prawns.', sizes: [['500g', 1690]] },
  { n: 'Dry Sprats (Halmasso)', si: 'හාල්මැස්සෝ', ta: 'நெத்திலி கருவாடு', cat: 'meat-seafood', sub: 'dry-fish', b: '', d: 'Sun-dried sprats for sambol and curry.', sizes: [['250g', 620], ['500g', 1190]], tags: ['best'] },
  { n: 'Dry Fish (Katta)', si: 'කරවල', ta: 'கருவாடு', cat: 'meat-seafood', sub: 'dry-fish', b: '', d: 'Premium dried katta fish.', sizes: [['250g', 890]] },
  { n: 'Maldive Fish Chips', si: 'උම්බලකඩ', ta: 'உம்பலகடா', cat: 'meat-seafood', sub: 'dry-fish', b: 'Krish', d: 'Dried maldive fish chips for sambol and curries.', sizes: [['100g', 480], ['250g', 1090]] },

  // ---------------------------------------------------------------- Personal Care
  { n: 'Anti-Dandruff Shampoo', si: 'ෂැම්පු', ta: 'ஷாம்பு', cat: 'personal-care', sub: 'hair-care', b: 'Sunsilk', d: 'Shampoo that cleans and controls dandruff.', sizes: [['180ml', 690], ['350ml', 1250]], sale: 10 },
  { n: 'Hair Conditioner', si: 'කන්ඩිෂනර්', ta: 'கண்டிஷனர்', cat: 'personal-care', sub: 'hair-care', b: 'Sunsilk', d: 'Smoothing conditioner for soft, manageable hair.', sizes: [['180ml', 720]] },
  { n: 'Coconut Hair Oil', si: 'හිසකෙස් තෙල්', ta: 'தலை எண்ணெய்', cat: 'personal-care', sub: 'hair-care', b: "Nature's Beauty", d: 'Herbal coconut hair oil.', sizes: [['200ml', 490]] },
  { n: 'Bathing Soap', si: 'නාන සබන්', ta: 'குளியல் சோப்பு', cat: 'personal-care', sub: 'soap-body', b: 'Lifebuoy', d: 'Germ-protection bathing soap bar.', sizes: [['100g', 165], ['4 pack', 610]], tags: ['best'] },
  { n: 'Herbal Soap', si: 'ඖෂධීය සබන්', ta: 'மூலிகை சோப்பு', cat: 'personal-care', sub: 'soap-body', b: "Nature's Beauty", d: 'Ayurvedic herbal soap with natural extracts.', sizes: [['100g', 195]] },
  { n: 'Toothpaste', si: 'දන්තාලේප', ta: 'பற்பசை', cat: 'personal-care', sub: 'oral-care', b: 'Signal', d: 'Cavity-protection fluoride toothpaste.', sizes: [['120g', 390], ['200g', 590]], tags: ['best'] },
  { n: 'Herbal Toothpaste', si: 'ඖෂධීය දන්තාලේප', ta: 'மூலிகை பற்பசை', cat: 'personal-care', sub: 'oral-care', b: 'Clogard', d: 'Clove-based herbal toothpaste.', sizes: [['120g', 380]] },
  { n: 'Toothbrush (Medium)', si: 'දත් බුරුසුව', ta: 'பல் துலக்கி', cat: 'personal-care', sub: 'oral-care', b: 'Signal', d: 'Medium-bristle toothbrush.', sizes: [['1 piece', 190], ['3 pack', 490]] },
  { n: 'Face Wash', si: 'මුහුණ සේදීමේ', ta: 'முகம் கழுவும்', cat: 'personal-care', sub: 'face-care', b: "Nature's Beauty", d: 'Gentle daily face wash.', sizes: [['100ml', 620]] },
  { n: 'Roll-On Deodorant', si: 'ඩියෝඩ්‍රන්ට්', ta: 'டியோடரன்ட்', cat: 'personal-care', sub: 'deo-shaving', b: 'Signal', d: '48-hour protection roll-on deodorant.', sizes: [['50ml', 590]] },
  { n: 'Shaving Razor', si: 'රැවුල කපන', ta: 'ஷேவிங் ரேசர்', cat: 'personal-care', sub: 'deo-shaving', b: 'Atlas', d: 'Twin-blade disposable razors.', sizes: [['5 pack', 390]] },
  { n: 'Sanitary Napkins', si: 'සනීපාරක්ෂක තුවා', ta: 'சுகாதார நாப்கின்', cat: 'personal-care', sub: 'sanitary', b: 'Diva', d: 'Ultra-thin sanitary napkins with wings.', sizes: [['8 pack', 340], ['16 pack', 640]], sale: 5 },

  // ---------------------------------------------------------------- Household Cleaning
  { n: 'Washing Powder', si: 'රෙදි සෝදන කුඩු', ta: 'சலவை பொடி', cat: 'household-cleaning', sub: 'washing-powder', b: 'Sunlight', d: 'High-foam washing powder for hand and machine wash.', sizes: [['500g', 490], ['1kg', 920], ['3kg', 2590]], sale: 9, tags: ['best', 'featured'] },
  { n: 'Detergent Liquid', si: 'ද්‍රව රෙදි සෝදන', ta: 'திரவ சலவை', cat: 'household-cleaning', sub: 'washing-powder', b: 'Rin', d: 'Concentrated liquid detergent.', sizes: [['1L', 1090]] },
  { n: 'Dishwashing Liquid', si: 'පිඟන් සෝදන ද්‍රවය', ta: 'பாத்திரம் கழுவும் திரவம்', cat: 'household-cleaning', sub: 'dishwashing', b: 'Vim', d: 'Cuts grease fast, gentle on hands.', sizes: [['500ml', 490], ['750ml', 690]], tags: ['best'] },
  { n: 'Dishwash Bar', si: 'පිඟන් සෝදන කැට', ta: 'பாத்திரம் கழுவும் பார்', cat: 'household-cleaning', sub: 'dishwashing', b: 'Vim', d: 'Economical dishwashing bar.', sizes: [['200g', 165]] },
  { n: 'Floor Cleaner', si: 'බිම් ක්ලීනර්', ta: 'தரை கிளீனர்', cat: 'household-cleaning', sub: 'floor-toilet', b: 'Domex', d: 'Disinfectant floor cleaner with a fresh scent.', sizes: [['500ml', 590], ['1L', 990]] },
  { n: 'Toilet Cleaner', si: 'වැසිකිළි ක්ලීනර්', ta: 'கழிவறை கிளீனர்', cat: 'household-cleaning', sub: 'floor-toilet', b: 'Harpic', d: 'Thick toilet cleaner that removes tough stains.', sizes: [['500ml', 640]] },
  { n: 'Bleach', si: 'බ්ලීච්', ta: 'ப்ளீச்', cat: 'household-cleaning', sub: 'bleach', b: 'Domex', d: 'Household bleach for whitening and disinfecting.', sizes: [['1L', 490]] },
  { n: 'Scouring Sponge', si: 'ස්කවර් ස්පොන්ජ්', ta: 'ஸ்கவர் ஸ்பான்ஜ்', cat: 'household-cleaning', sub: 'sponges', b: 'Vim', d: 'Dual-sided scouring sponge.', sizes: [['3 pack', 290]] },
  { n: 'Steel Scrubber', si: 'වානේ ස්කර්බර්', ta: 'எஃகு ஸ்க்ரப்பர்', cat: 'household-cleaning', sub: 'sponges', b: 'Sera', d: 'Stainless steel scrubber for pots and pans.', sizes: [['2 pack', 210]] },

  // ---------------------------------------------------------------- Baby
  { n: 'Baby Diapers (Medium)', si: 'ළදරු ඩයපර්', ta: 'குழந்தை டயப்பர்', cat: 'baby', sub: 'diapers', b: 'Pampers', d: 'Soft, absorbent diapers for 6-11kg babies.', sizes: [['20 pack', 1490], ['48 pack', 3290]], sale: 8, tags: ['featured'] },
  { n: 'Baby Diapers (Large)', si: 'ළදරු ඩයපර් (ලොකු)', ta: 'குழந்தை டயப்பர் (பெரிய)', cat: 'baby', sub: 'diapers', b: 'Huggies', d: 'Large size diapers for 9-14kg babies.', sizes: [['20 pack', 1590]] },
  { n: 'Baby Wipes', si: 'ළදරු වයිප්ස්', ta: 'குழந்தை வைப்ஸ்', cat: 'baby', sub: 'diapers', b: 'Huggies', d: 'Fragrance-free baby wipes.', sizes: [['80 pack', 690]] },
  { n: 'Baby Soap', si: 'ළදරු සබන්', ta: 'குழந்தை சோப்பு', cat: 'baby', sub: 'baby-bath', b: 'Baby Cheramy', d: 'Mild soap for delicate baby skin.', sizes: [['100g', 245]], tags: ['best'] },
  { n: 'Baby Shampoo', si: 'ළදරු ෂැම්පු', ta: 'குழந்தை ஷாம்பு', cat: 'baby', sub: 'baby-bath', b: 'Baby Cheramy', d: 'No-tears baby shampoo.', sizes: [['200ml', 590]] },
  { n: 'Baby Powder', si: 'ළදරු පවුඩර්', ta: 'குழந்தை பவுடர்', cat: 'baby', sub: 'baby-bath', b: 'Baby Cheramy', d: 'Soothing baby talcum powder.', sizes: [['100g', 340]] },
  { n: 'Infant Cereal', si: 'ළදරු ආහාර', ta: 'குழந்தை உணவு', cat: 'baby', sub: 'baby-food', b: 'Nestle', d: 'Rice-based infant cereal, from 6 months.', sizes: [['200g', 890]] },

  // ---------------------------------------------------------------- Stationery
  { n: 'Ball Point Pen (Blue)', si: 'පෑන', ta: 'பேனா', cat: 'stationery', sub: 'pens-pencils', b: 'Atlas', d: 'Smooth-writing blue ball point pen.', sizes: [['1 piece', 45], ['10 pack', 390]], tags: ['best'] },
  { n: 'HB Pencils', si: 'පැන්සල්', ta: 'பென்சில்', cat: 'stationery', sub: 'pens-pencils', b: 'Atlas', d: 'HB graphite pencils for school and office.', sizes: [['10 pack', 290]] },
  { n: 'Exercise Book (80 pages)', si: 'අභ්‍යාස පොත', ta: 'பயிற்சி புத்தகம்', cat: 'stationery', sub: 'books', b: 'Atlas', d: 'Ruled 80-page exercise book.', sizes: [['1 piece', 95], ['5 pack', 440]], tags: ['best'] },
  { n: 'Spiral Notebook', si: 'නෝට් පොත', ta: 'நோட்புக்', cat: 'stationery', sub: 'books', b: 'Atlas', d: '120-page spiral bound notebook.', sizes: [['1 piece', 290]] },
  { n: 'Eraser & Sharpener Set', si: 'මකනය සහ තලනය', ta: 'அழிப்பான் மற்றும் கூர்தீட்டி', cat: 'stationery', sub: 'school-supplies', b: 'Atlas', d: 'Eraser and pencil sharpener set.', sizes: [['1 set', 120]] },
  { n: 'Colour Pencils', si: 'වර්ණ පැන්සල්', ta: 'வண்ண பென்சில்', cat: 'stationery', sub: 'school-supplies', b: 'Atlas', d: '12 assorted colour pencils.', sizes: [['12 pack', 390]] },
  { n: 'Glue Stick', si: 'ග්ලූ ස්ටික්', ta: 'பசை குச்சி', cat: 'stationery', sub: 'school-supplies', b: 'Atlas', d: 'Non-toxic glue stick.', sizes: [['15g', 145]] },
  { n: 'Permanent Marker', si: 'මාකර්', ta: 'மார்க்கர்', cat: 'stationery', sub: 'school-supplies', b: 'Atlas', d: 'Black permanent marker.', sizes: [['1 piece', 165]] },

  // ---------------------------------------------------------------- Kitchen & Household
  { n: 'Food Storage Containers', si: 'ආහාර බඳුන්', ta: 'உணவு கொள்கலன்', cat: 'kitchen-household', sub: 'storage', b: 'Sera', d: 'Airtight plastic food containers, set of 3.', sizes: [['3 pack', 890]] },
  { n: 'Garbage Bags (Large)', si: 'කසළ බෑග්', ta: 'குப்பை பைகள்', cat: 'kitchen-household', sub: 'storage', b: 'Sera', d: 'Heavy-duty large garbage bags.', sizes: [['20 pack', 490]], tags: ['best'] },
  { n: 'Shopping Bags', si: 'සාප්පු බෑග්', ta: 'ஷாப்பிங் பைகள்', cat: 'kitchen-household', sub: 'storage', b: 'Sera', d: 'Reusable woven shopping bag.', sizes: [['1 piece', 190]] },
  { n: 'Aluminium Foil', si: 'ඇලුමිනියම් ෆොයිල්', ta: 'அலுமினியம் ஃபாயில்', cat: 'kitchen-household', sub: 'foil-wrap', b: 'Sera', d: 'Kitchen aluminium foil roll.', sizes: [['10m', 590]] },
  { n: 'Cling Film', si: 'ක්ලින් ෆිල්ම්', ta: 'கிளிங் ஃபிலிம்', cat: 'kitchen-household', sub: 'foil-wrap', b: 'Sera', d: 'Food-safe cling wrap roll.', sizes: [['30m', 490]] },
  { n: 'Kitchen Towel Roll', si: 'මුළුතැන්ගෙය තුවා', ta: 'சமையலறை துண்டு', cat: 'kitchen-household', sub: 'paper-goods', b: 'Sera', d: 'Absorbent two-ply kitchen towels.', sizes: [['2 rolls', 490]] },
  { n: 'Facial Tissues', si: 'ටිෂු', ta: 'திசு', cat: 'kitchen-household', sub: 'paper-goods', b: 'Sera', d: 'Soft two-ply facial tissue box.', sizes: [['100 sheets', 340]] },
  { n: 'Safety Matches', si: 'ගිනිකූරු', ta: 'தீப்பெட்டி', cat: 'kitchen-household', sub: 'matches-batteries', b: 'Sera', d: 'Safety match boxes.', sizes: [['10 pack', 190]] },
  { n: 'AA Batteries', si: 'AA බැටරි', ta: 'AA பேட்டரி', cat: 'kitchen-household', sub: 'matches-batteries', b: 'Sera', d: 'Long-life AA alkaline batteries.', sizes: [['4 pack', 490]] },

  // ---------------------------------------------------------------- Pet Supplies
  { n: 'Dog Food (Adult)', si: 'බලු ආහාර', ta: 'நாய் உணவு', cat: 'pet-supplies', sub: 'pet-food', b: 'Pedigree', d: 'Complete dry food for adult dogs.', sizes: [['1.5kg', 2190], ['3kg', 3990]], sale: 7 },
  { n: 'Cat Food (Adult)', si: 'පූසන් ආහාර', ta: 'பூனை உணவு', cat: 'pet-supplies', sub: 'pet-food', b: 'Whiskas', d: 'Ocean fish flavour dry cat food.', sizes: [['1.2kg', 2290]] },
  { n: 'Dog Treats', si: 'බලු ට්‍රීට්ස්', ta: 'நாய் விருந்து', cat: 'pet-supplies', sub: 'pet-food', b: 'Pedigree', d: 'Chewy dental treats for dogs.', sizes: [['150g', 690]], tags: ['new'] },
  { n: 'Pet Shampoo', si: 'සුරතල් ෂැම්පු', ta: 'செல்லப்பிராணி ஷாம்பு', cat: 'pet-supplies', sub: 'pet-care', b: 'Pedigree', d: 'Tick and flea control pet shampoo.', sizes: [['200ml', 890]] },
];
