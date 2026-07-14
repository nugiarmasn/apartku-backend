import os
from googleapiclient.discovery import build
from app.core.config import settings
from app.core.firebase_init import db
from datetime import datetime

class YouTubeService:
    def __init__(self):
        self.api_key = settings.YOUTUBE_API_KEY
        
        if not self.api_key:
            print("❌ ERROR: YouTube Key tetep nggak kebaca, Bro!")
            self.youtube = None
        else:
            try:
                self.youtube = build(
                    'youtube', 
                    'v3', 
                    developerKey=self.api_key, 
                    static_discovery=False
                )
                print(f"✅ YouTube Service OK. Key: {self.api_key[:5]}***")
            except Exception as e:
                print(f"❌ Failed to initialize YouTube API: {e}")
                self.youtube = None

    async def get_realtime_insights(self, query="apartemen indonesia"):
        if not self.youtube:
            return []

        try:
            search_request = self.youtube.search().list(
                q=query,
                part='id,snippet',
                maxResults=3,
                type='video',
                order='relevance'
            )
            search_response = search_request.execute()

            all_insights = []

            for item in search_response.get('items', []):
                video_id = item['id']['videoId']
                video_title = item['snippet']['title']
                channel_name = item['snippet']['channelTitle']

                try:
                    comments_request = self.youtube.commentThreads().list(
                        part='snippet',
                        videoId=video_id,
                        maxResults=5,
                        textFormat='plainText'
                    )
                    comments_response = comments_request.execute()

                    for comment_item in comments_response.get('items', []):
                        comment_data = comment_item['snippet']['topLevelComment']['snippet']
                        text = comment_data['textDisplay']
                        
                        sentiment = self._quick_sentiment(text)
                        topic = self._detect_topic(text)

                        insight = {
                            "video_title": video_title,
                            "channel": channel_name,
                            "comment": text,
                            "author": comment_data['authorDisplayName'],
                            "likes": comment_data['likeCount'],
                            "sentiment": sentiment,
                            "category": topic,
                            "date": comment_data['publishedAt'],
                            "fetched_at": datetime.now().isoformat()
                        }

                        db.collection("youtube_insights").add(insight)
                        all_insights.append(insight)

                except Exception as e:
                    print(f"Skipping video {video_id} because: {e}")
                    continue

            return all_insights

        except Exception as e:
            print(f"YouTube API Error: {e}")
            return []

    def _quick_sentiment(self, text):
        text = text.lower()
        positive_words = ['bagus', 'keren', 'rapi', 'nyaman', 'murah', 'minat', 'oke', 'mantap']
        negative_words = ['mahal', 'jelek', 'buruk', 'kecewa', 'sempit', 'macet', 'berisik']
        
        if any(word in text for word in positive_words):
            return "POSITIF"
        if any(word in text for word in negative_words):
            return "NEGATIF"
        return "NETRAL"

    def _detect_topic(self, text):
        text = text.lower()
        if 'harga' in text or 'cicil' in text or 'jt' in text or 'rupiah' in text:
            return "FINANSIAL"
        if 'lokasi' in text or 'daerah' in text or 'akses' in text:
            return "LOKASI"
        if 'fasilitas' in text or 'pool' in text or 'gym' in text:
            return "FASILITAS"
        return "UMUM"