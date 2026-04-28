enum InteractionType {
  crush,
  friend,
  ameny;

  String get label => switch (this) {
    InteractionType.crush => 'Crush',
    InteractionType.friend => 'Friend',
    InteractionType.ameny => 'Ameny',
  };
}
