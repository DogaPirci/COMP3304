# COMP3304
VogueVault Online Closet
## 1. Project Overview

VogueVault is an AI-powered digital wardrobe management system designed to bridge the gap between physical closets and digital convenience. Research shows that people spend an average of 17 minutes every morning deciding what to wear, often leading to "decision fatigue" and overconsumption of fast fashion.
VogueVault solves these problems by creating a personalised digital twin of a user's wardrobe. Leveraging the power of the Google Gemini Vision API, the system automatically categorises uploaded clothing items, suggests outfits based on specific dress codes, and helps users make more sustainable fashion choices.
Users can upload a photo of any clothing item and let the AI classify it instantly  no manual tagging required. When a specific event or dress code comes up, VogueVault filters the wardrobe and generates outfit combinations tailored to the occasion. For users who find inspiration in runway looks or social media posts, the AI Style Matcher finds the closest matches from their own wardrobe, reducing the urge to buy new items.
When a required piece is genuinely missing, the Smart Commerce Integration  powered by the Google Custom Search API — surfaces real product recommendations with images and direct purchase links from online retailers. Every search result is cached to minimise API usage and ensure a fast experience.
Built with Next.js, Supabase, and deployed as a single Docker container on Railway.app, VogueVault is designed to be lightweight, maintainable, and ready to scale — developed by a four-person student team as part of COMP 3304 Fundamentals of Software Engineering at Yasar University.

### Key Objectives:
* **Reduce Decision Fatigue:** Help users quickly translate abstract dress codes (like Smart Casual or Formal) into concrete outfits from their own collection.
* **Promote Sustainability:** Increase the utility of existing clothes to discourage unnecessary new purchases.
* **Smart Organization:** Automatically tag and sort items by category, colour, and style without manual data entry.
* **Visual Inspiration:** Allow users to upload "inspiration photos" and find the closest matching items within their own digital closet.
