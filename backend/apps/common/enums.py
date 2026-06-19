from django.db import models


class LeagueFormat(models.TextChoices):
    SINGLE_ROUND_ROBIN = "SINGLE_ROUND_ROBIN", "Single Round Robin"
    DOUBLE_ROUND_ROBIN = "DOUBLE_ROUND_ROBIN", "Double Round Robin"


class PlayerPosition(models.TextChoices):
    GOALKEEPER = "GOALKEEPER", "Goalkeeper"
    DEFENDER = "DEFENDER", "Defender"
    MIDFIELDER = "MIDFIELDER", "Midfielder"
    FORWARD = "FORWARD", "Forward"


class MatchStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    LIVE = "LIVE", "Live"
    FINISHED = "FINISHED", "Finished"


class MatchEventType(models.TextChoices):
    GOAL = "GOAL", "Goal"
    YELLOW_CARD = "YELLOW_CARD", "Yellow Card"
    RED_CARD = "RED_CARD", "Red Card"
