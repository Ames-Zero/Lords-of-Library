from config import CATEGORY_NAMES


def expand_category(abbrev: str) -> str:
    """Convert category abbreviation to full name."""
    return CATEGORY_NAMES.get(abbrev, abbrev)


def expand_categories(abbrev_list: list[str]) -> list[str]:
    """Convert list of category abbreviations to full names."""
    return [expand_category(cat) for cat in abbrev_list]
