INSERT INTO site_settings (key, value) VALUES
  ('brandLine', 'هدوم تفضل هادية.'),
  ('logoText', 'NIVO'),
  ('phone', '+20 100 555 0199'),
  ('phoneHours', 'السبت – الخميس · ١٠ص – ٦م'),
  ('email', 'studio@nivo.eg'),
  ('address', '١٢ شارع البستان، الزمالك، القاهرة'),
  ('addressNote', 'الاستوديو مفتوح بالحجز المسبق'),
  ('productionHours', 'الورشة: بورتو، البرتغال · ٩ص – ٥م'),
  ('mapText', 'الزمالك، القاهرة'),
  ('whatsapp', '+201005550199'),
  ('instagramUrl', 'https://instagram.com/nivo'),
  ('instagramName', '@nivo.studio'),
  ('facebookUrl', 'https://facebook.com/nivo'),
  ('facebookName', 'NIVO'),
  ('tiktokUrl', 'https://tiktok.com/@nivo'),
  ('tiktokName', '@nivo'),
  ('pinterestUrl', 'https://pinterest.com/nivo'),
  ('pinterestName', 'NIVO')
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint
INSERT INTO products (name, slug, collection, category, price, compare_at_price, sizes, colors, description, material, image_url, gallery_urls, featured, active, stock, sort_order) VALUES
  ('بالطو صوف طويل', 'wool-long-coat', 'خريف / شتاء ٢٤', 'women', 4850, 5600, 'S,M,L,XL', 'كريمي، بيج', 'بالطو صوف بقصة مستقيمة وكتف ناعم. مبطن بالكامل، وبيتدفى من غير ما يبقى تقيل. القطعة اللي بتلبسها كل يوم من أكتوبر لآخر مارس.', 'صوف ميرينو ٨٠٪ · بوليستر ٢٠٪', '/images/hero-coat.jpg', '/images/hero-coat.jpg,/images/coat-camel.jpg', true, true, 12, 1),
  ('بالطو كاميل دوبل برستد', 'camel-double-coat', 'خريف / شتاء ٢٤', 'women', 5200, NULL, 'S,M,L', 'كاميل', 'بالطو كاميل بصفّين أزرار وياقة عريضة. قصّة كلاسيكية بتفضل معاك سنين.', 'صوف ٩٠٪ · كشمير ١٠٪', '/images/coat-camel.jpg', '/images/coat-camel.jpg,/images/hero-coat.jpg', true, true, 8, 2),
  ('بلوفر تريكو مضلّع', 'ribbed-knit-sweater', 'خريف / شتاء ٢٤', 'knitwear', 1850, 2200, 'S,M,L,XL', 'بيج، رمادي', 'بلوفر تريكو مضلّع بحبكة ناعمة. خفيف على الجسم ودافي في نفس الوقت.', 'صوف ٧٠٪ · قطن ٣٠٪', '/images/knit-folded.jpg', '/images/knit-folded.jpg', true, true, 24, 3),
  ('كارديجان كشمير', 'cashmere-cardigan', 'خريف / شتاء ٢٤', 'knitwear', 3400, NULL, 'S,M,L', 'كريمي', 'كارديجان كشمير بأزرار قرن وخامة بتطرى مع الغسيل.', 'كشمير ١٠٠٪', '/images/knit-folded.jpg', '/images/knit-folded.jpg', false, true, 10, 4),
  ('قميص كتان واسع', 'linen-shirt', 'ربيع / صيف ٢٤', 'men', 1450, NULL, 'S,M,L,XL', 'أبيض، أزرق فاتح', 'قميص كتان بقصة واسعة وياقة إيطالية. بيتنفّس في الحر وبيتحسّن مع الوقت.', 'كتان ١٠٠٪', '/images/linen-texture.jpg', '/images/linen-texture.jpg', true, true, 30, 5),
  ('بنطلون صوف مفصّل', 'wool-trousers', 'خريف / شتاء ٢٤', 'men', 2100, 2500, '30,32,34,36', 'رمادي، أسود', 'بنطلون صوف بكسر أمامي وقصة مستقيمة. مفصّل عند الوسط وواسع عند الرجل.', 'صوف ٨٥٪ · إيلاستين ١٥٪', '/images/workshop.jpg', '/images/workshop.jpg', false, true, 18, 6),
  ('جاكيت صوف مبطن', 'padded-wool-jacket', 'خريف / شتاء ٢٤', 'men', 3900, NULL, 'M,L,XL', 'أسود', 'جاكيت صوف مبطن بحشوة خفيفة. دافي من غير حجم زيادة.', 'صوف ٧٥٪ · بوليستر ٢٥٪', '/images/workshop.jpg', '/images/workshop.jpg', false, true, 9, 7),
  ('فستان حرير مستقيم', 'silk-slip-dress', 'ربيع / صيف ٢٤', 'women', 2950, 3400, 'XS,S,M,L', 'شامبانيا', 'فستان حرير بقصة مستقيمة وحمالات رفيعة. بيتحرك مع الجسم.', 'حرير ١٠٠٪', '/images/editorial-two.jpg', '/images/editorial-two.jpg', true, true, 14, 8),
  ('تونيك كتان طويل', 'linen-tunic', 'ربيع / صيف ٢٤', 'women', 1750, NULL, 'S,M,L', 'أوف وايت', 'تونيك كتان طويل بفتحة جانبية. بيتلبس لوحده أو فوق بنطلون.', 'كتان ١٠٠٪', '/images/linen-texture.jpg', '/images/linen-texture.jpg', false, true, 20, 9),
  ('شال صوف عريض', 'wool-scarf', 'خريف / شتاء ٢٤', 'knitwear', 950, 1200, 'مقاس واحد', 'بيج، زيتوني', 'شال صوف عريض بحواف مضلّعة. الطريقة الأسرع إنك تدفّي أي لوك.', 'صوف ١٠٠٪', '/images/fabric-rolls.jpg', '/images/fabric-rolls.jpg', false, true, 40, 10),
  ('بلوفر رقبة عالية', 'turtleneck-sweater', 'خريف / شتاء ٢٤', 'men', 1950, NULL, 'S,M,L,XL', 'أسود، كحلي', 'بلوفر رقبة عالية بحبكة متوسطة. القطعة الأساسية في أي دولاب.', 'صوف ٨٠٪ · قطن ٢٠٪', '/images/knit-folded.jpg', '/images/knit-folded.jpg', false, true, 22, 11),
  ('معطف كشمير طويل', 'cashmere-overcoat', 'خريف / شتاء ٢٤', 'women', 6400, 7200, 'S,M,L', 'كريمي', 'معطف كشمير طويل بقصة مريحة. أرقى قطعة في المجموعة.', 'كشمير ٩٠٪ · صوف ١٠٪', '/images/about-hero.jpg', '/images/about-hero.jpg,/images/hero-coat.jpg', true, true, 6, 12)
ON CONFLICT (slug) DO NOTHING;
