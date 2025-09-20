# chat/models.py
from django.db import models
from django.utils import timezone

class Chat(models.Model):
    prompt = models.TextField()
    result = models.TextField(blank=True, null=True)
    date_time = models.DateTimeField(default=timezone.now)
    conversation_name = models.CharField(max_length=360)
    message_type = models.CharField(max_length=50, default='Text')
    generated_image_b64 = models.TextField(null=True, blank=True)

    
    class Meta:
        db_table = 'chat'

    def __str__(self):
        return f"Chat {self.id} - {self.conversation_name}"
