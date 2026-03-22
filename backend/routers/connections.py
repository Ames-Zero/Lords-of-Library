from fastapi import APIRouter
from models import ConnectionOut

router = APIRouter(prefix="/connections", tags=["connections"])

# Static list of sample connections
SAMPLE_CONNECTIONS = [
    ConnectionOut(
        name="Dr. Alice Chen",
        bio="ML researcher focused on NLP and transfer learning",
        topics=["NLP", "Transfer Learning", "Transformers"]
    ),
    ConnectionOut(
        name="Prof. Bob Williams",
        bio="Computer vision expert specializing in object detection",
        topics=["Computer Vision", "Object Detection", "Deep Learning"]
    ),
    ConnectionOut(
        name="Dr. Carol Martinez",
        bio="Reinforcement learning enthusiast with industry experience",
        topics=["Reinforcement Learning", "Game AI", "Multi-agent Systems"]
    ),
    ConnectionOut(
        name="Prof. David Kumar",
        bio="Statistical ML researcher working on Bayesian methods",
        topics=["Bayesian Methods", "Probabilistic Models", "Inference"]
    ),
    ConnectionOut(
        name="Dr. Emma Johnson",
        bio="AI ethics researcher and policy advocate",
        topics=["AI Ethics", "Fairness", "Interpretability"]
    )
]

@router.get("")
async def get_connections():
    """
    Get list of similar users/researchers (static).
    """
    return SAMPLE_CONNECTIONS
