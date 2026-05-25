import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, index=True)
    filepath = Column(String)
    content_type = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), default=datetime.datetime.utcnow)
