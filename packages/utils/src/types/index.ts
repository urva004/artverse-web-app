// ═══════════════════════════════════════════════════
// ArtVerse — Shared Types
// ═══════════════════════════════════════════════════

// ── Enums (mirrors Prisma enums for frontend usage) ──

export enum UserRole {
  BUYER = "BUYER",
  SELLER = "SELLER",
  ADMIN = "ADMIN",
}

export enum ArtCategory {
  LIP_ART = "LIP_ART",
  SKETCHES = "SKETCHES",
  MEHNDI_DESIGNS = "MEHNDI_DESIGNS",
  PAINTINGS = "PAINTINGS",
  DIGITAL_ART = "DIGITAL_ART",
  ART_MATERIALS = "ART_MATERIALS",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum GroupType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export enum GroupMemberRole {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
}

export enum MessageStatus {
  SENT = "SENT",
  SEEN = "SEEN",
  DELETED = "DELETED",
}

export enum NotificationType {
  ORDER_PLACED = "ORDER_PLACED",
  ORDER_SHIPPED = "ORDER_SHIPPED",
  ORDER_DELIVERED = "ORDER_DELIVERED",
  ORDER_CANCELLED = "ORDER_CANCELLED",
  NEW_FOLLOWER = "NEW_FOLLOWER",
  ARTWORK_LIKED = "ARTWORK_LIKED",
  ARTWORK_COMMENTED = "ARTWORK_COMMENTED",
  ARTWORK_UPLOADED = "ARTWORK_UPLOADED",
  PERSONAL_MESSAGE = "PERSONAL_MESSAGE",
  COMMUNITY_MESSAGE = "COMMUNITY_MESSAGE",
  NEW_REVIEW = "NEW_REVIEW",
  PRODUCT_APPROVED = "PRODUCT_APPROVED",
  PRODUCT_REJECTED = "PRODUCT_REJECTED",
  GROUP_INVITE = "GROUP_INVITE",
  GROUP_MESSAGE = "GROUP_MESSAGE",
  PRICE_DROP = "PRICE_DROP",
  SYSTEM = "SYSTEM",
}

// ── User Types ──

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  bio: string | null;
  socialLinks: SocialLinks | null;
  createdAt: string;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  website?: string;
  behance?: string;
}

export interface UserProfile extends UserPublic {
  followerCount: number;
  followingCount: number;
  productCount: number;
  isFollowing?: boolean;
}

// ── Auth Types ──

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserPublic;
  tokens: AuthTokens;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export type OnboardingRole = Exclude<UserRole, UserRole.ADMIN>;

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface OnboardingChoiceInput {
  role: OnboardingRole;
}

// ── Product Types ──

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: ArtCategory;
  tags: string[];
  stock: number;
  isApproved: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  sellerId: string;
  seller: UserPublic;
  averageRating: number;
  reviewCount: number;
  isWishlisted?: boolean;
}

export interface ProductCreateInput {
  title: string;
  description: string;
  price: number;
  category: ArtCategory;
  tags: string[];
  stock: number;
}

export interface ProductFilters {
  category?: ArtCategory;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  sellerId?: string;
  isApproved?: boolean;
  sortBy?: "price_asc" | "price_desc" | "newest" | "rating" | "popular";
  page?: number;
  limit?: number;
}

// ── Order Types ──

export interface Order {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  razorpayOrderId: string | null;
  invoiceUrl: string | null;
  createdAt: string;
  buyerId: string;
  buyer: UserPublic;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  productId: string;
  product: Product;
}



// ── Review Types ──

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userId: string;
  user: UserPublic;
  productId: string;
}



// ── Cart Types (client-side only) ──

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  sellerName: string;
  isSavedForLater?: boolean;
}

// ── Wishlist Types ──

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
}

// ── Group / Chat Types ──

export interface Group {
  id: string;
  name: string;
  description: string | null;
  type: GroupType;
  coverImage: string | null;
  creatorId: string;
  creator: UserPublic;
  memberCount: number;
  isMember?: boolean;
  createdAt: string;
}

export interface GroupMessage {
  id: string;
  content: string;
  imageUrl: string | null;
  metadata?: MessageMetadata | null;
  status: MessageStatus;
  createdAt: string;
  updatedAt?: string;
  senderId: string;
  sender: UserPublic;
  groupId: string;
}

export interface SharedArtwork {
  id: string;
  title: string;
  imageUrl: string;
  shareUrl: string;
  price?: number;
  sellerName?: string;
  category?: ArtCategory;
}

export interface MessageMetadata {
  artwork?: SharedArtwork;
}

export interface DirectMessage {
  id: string;
  content: string;
  imageUrl: string | null;
  metadata?: MessageMetadata | null;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  sender: UserPublic;
  recipientId: string;
  recipient: UserPublic;
}

// ── Notification Types ──

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  userId: string;
}

// ── API Response Types ──

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// ── Seller Dashboard Types ──

export interface SellerStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalViews: number;
  conversionRate: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  orders: number;
}
