import random
from sqlalchemy.orm import Session
from database.models import Post, UserProfile


def generate_random_id() -> str:
    """Generate a random 10-digit ID"""
    return ''.join(str(random.randint(0, 9)) for _ in range(10))


def generate_unique_post_id(db: Session) -> str:
    """Generate a unique 10-digit ID for a post with collision check"""
    max_attempts = 100
    for _ in range(max_attempts):
        unique_id = generate_random_id()
        # Check if this ID already exists
        if not db.query(Post).filter(Post.unique_id == unique_id).first():
            return unique_id
    # Fallback: use timestamp-based ID if collision check fails too many times
    raise Exception("Failed to generate unique ID after max attempts")


def generate_unique_profile_id(db: Session) -> str:
    """Generate a unique 10-digit ID for a user profile with collision check"""
    max_attempts = 100
    for _ in range(max_attempts):
        unique_id = generate_random_id()
        # Check if this ID already exists
        if not db.query(UserProfile).filter(UserProfile.unique_id == unique_id).first():
            return unique_id
    # Fallback: raise error if collision check fails too many times
    raise Exception("Failed to generate unique ID after max attempts")
