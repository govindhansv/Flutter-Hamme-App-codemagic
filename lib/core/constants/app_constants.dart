import 'package:flutter_dotenv/flutter_dotenv.dart';

final class AppConstants {
  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:3000/api/v1';

  static String get shareLinkBase =>
      dotenv.env['SHARE_LINK_BASE'] ?? 'https://app.hamme.link/u';

  static String get appScheme => dotenv.env['APP_SCHEME'] ?? 'hamme';

  static String get appHost => dotenv.env['APP_HOST'] ?? 'app.hamme.link';
}
