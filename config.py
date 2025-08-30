"""
Configuration settings for SMP Salary Analyzer
"""
import os
from pathlib import Path

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or 'uploads'
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    ALLOWED_EXTENSIONS = {'pdf'}
    
    # Ensure upload directory exists
    Path(UPLOAD_FOLDER).mkdir(exist_ok=True)

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    ENV = 'development'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    ENV = 'production'
    
    # Use environment variables in production
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable must be set in production")

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    WTF_CSRF_ENABLED = False

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}