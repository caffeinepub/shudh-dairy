import type { Review as BackendReview } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { MessageSquare, Star, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 20,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform duration-100 ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          }`}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            fill={
              star <= (hovered || value) ? "oklch(0.78 0.17 72)" : "transparent"
            }
            stroke={
              star <= (hovered || value)
                ? "oklch(0.78 0.17 72)"
                : "oklch(0.70 0.04 72)"
            }
          />
        </button>
      ))}
    </div>
  );
}

type UIReview = {
  id: bigint;
  name: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
};

function toUIReview(r: BackendReview): UIReview {
  const ms = Number(r.timestamp) / 1_000_000;
  return {
    id: r.id,
    name: r.customerName,
    rating: Number(r.rating),
    comment: r.comment,
    date: new Date(ms).toISOString().split("T")[0],
    helpful: Number(r.helpful),
  };
}

export function CustomerReviews() {
  const { actor, isFetching: actorLoading } = useActor();
  const [reviews, setReviews] = useState<UIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [helpedSet, setHelpedSet] = useState<Set<string>>(new Set());

  const loadReviews = useCallback(async () => {
    if (!actor) return;
    try {
      const raw = await actor.getAllReviews();
      const sorted = [...raw]
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
        .map(toUIReview);
      setReviews(sorted);
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!actorLoading && actor) void loadReviews();
    else if (!actorLoading && !actor) setLoading(false);
  }, [actorLoading, actor, loadReviews]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("review_helped");
      if (raw) setHelpedSet(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a review.");
      return;
    }
    if (!actor) {
      toast.error("Not connected. Please try again.");
      return;
    }
    setSubmitting(true);
    try {
      await actor.addReview(name.trim(), BigInt(rating), comment.trim());
      await loadReviews();
      setName("");
      setRating(0);
      setComment("");
      setShowForm(false);
      toast.success("Thank you for your review!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const markHelpful = async (review: UIReview) => {
    const key = review.id.toString();
    if (helpedSet.has(key) || !actor) return;
    try {
      await actor.markReviewHelpful(review.id);
      await loadReviews();
      const newSet = new Set([...helpedSet, key]);
      setHelpedSet(newSet);
      try {
        localStorage.setItem("review_helped", JSON.stringify([...newSet]));
      } catch {}
    } catch (err) {
      console.error(err);
      toast.error("Could not mark as helpful.");
    }
  };

  return (
    <section
      data-ocid="reviews.section"
      className="relative overflow-hidden py-16 sm:py-20"
      style={{
        background:
          "linear-gradient(to bottom, oklch(0.99 0.012 88 / 0.85), oklch(0.97 0.018 80 / 0.90))",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section heading */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
            <MessageSquare
              size={18}
              className="text-primary"
              aria-hidden="true"
            />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Customer Reviews
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            What our customers say about our products
          </p>
        </motion.div>

        {/* Rating summary */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-10 p-6 rounded-2xl border border-border bg-card/70 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          {/* Average score */}
          <div className="text-center shrink-0">
            <p
              className="font-display text-6xl font-bold leading-none"
              style={{ color: "oklch(0.78 0.17 72)" }}
            >
              {avgRating.toFixed(1)}
            </p>
            <StarRating value={Math.round(avgRating)} readonly size={18} />
            <p className="text-xs text-muted-foreground mt-1">
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Bar chart */}
          <div className="flex-1 w-full max-w-xs space-y-1.5">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right text-muted-foreground font-medium">
                  {star}
                </span>
                <Star
                  size={11}
                  fill="oklch(0.78 0.17 72)"
                  stroke="oklch(0.78 0.17 72)"
                />
                <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "oklch(0.78 0.17 72)" }}
                    initial={{ width: 0 }}
                    whileInView={{
                      width:
                        reviews.length > 0
                          ? `${(count / reviews.length) * 100}%`
                          : "0%",
                    }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <span className="w-4 text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Write review button */}
        <div className="flex justify-center mb-8">
          <Button
            data-ocid="reviews.write_review_button"
            onClick={() => setShowForm((v) => !v)}
            variant={showForm ? "outline" : "default"}
            className="gap-2 rounded-xl px-6 font-semibold"
          >
            <Star size={15} />
            {showForm ? "Cancel" : "Write a Review"}
          </Button>
        </div>

        {/* Review form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              key="review-form"
              data-ocid="reviews.form"
              onSubmit={(e) => {
                void handleSubmit(e);
              }}
              className="max-w-xl mx-auto mb-10 p-6 rounded-2xl border border-border bg-card shadow-md"
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-display text-lg font-bold text-foreground mb-5">
                Share Your Experience
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="review-name"
                    className="text-sm font-semibold text-foreground block mb-1.5"
                  >
                    Your Name
                  </label>
                  <Input
                    id="review-name"
                    data-ocid="reviews.name_input"
                    placeholder="e.g. Ravi Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <span className="text-sm font-semibold text-foreground block mb-1.5">
                    Rating
                  </span>
                  <StarRating value={rating} onChange={setRating} size={28} />
                  {rating > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {
                        ["Terrible", "Poor", "Average", "Good", "Excellent!"][
                          rating - 1
                        ]
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="review-comment"
                    className="text-sm font-semibold text-foreground block mb-1.5"
                  >
                    Your Review
                  </label>
                  <Textarea
                    id="review-comment"
                    data-ocid="reviews.comment_textarea"
                    placeholder="Tell others about your experience with our products..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="rounded-xl resize-none"
                  />
                </div>

                <Button
                  data-ocid="reviews.submit_button"
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl font-semibold"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {(loading || actorLoading) && (
          <div
            data-ocid="reviews.loading_state"
            className="flex justify-center py-12"
          >
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm">Loading reviews...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !actorLoading && reviews.length === 0 && (
          <motion.div
            data-ocid="reviews.empty_state"
            className="text-center py-16 flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "oklch(0.94 0.04 88)" }}
            >
              ⭐
            </div>
            <p className="font-display text-xl font-semibold text-foreground">
              No reviews yet
            </p>
            <p className="text-muted-foreground text-sm max-w-xs">
              Be the first to share your experience with our products!
            </p>
          </motion.div>
        )}

        {/* Reviews list */}
        {!loading && !actorLoading && reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id.toString()}
                data-ocid={`reviews.item.${i + 1}`}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.07, 0.3) }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: "oklch(0.56 0.16 62)" }}
                    >
                      {review.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground leading-tight">
                        {review.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {/* Verified badge */}
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      background: "oklch(0.94 0.06 145)",
                      color: "oklch(0.42 0.14 145)",
                    }}
                  >
                    ✓ Verified
                  </span>
                </div>

                {/* Stars */}
                <StarRating value={review.rating} readonly size={16} />

                {/* Comment */}
                <p className="text-sm text-foreground/85 leading-relaxed flex-1">
                  &ldquo;{review.comment}&rdquo;
                </p>

                {/* Helpful */}
                <button
                  type="button"
                  data-ocid={`reviews.helpful_button.${i + 1}`}
                  onClick={() => {
                    void markHelpful(review);
                  }}
                  disabled={helpedSet.has(review.id.toString())}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors w-fit ${
                    helpedSet.has(review.id.toString())
                      ? "text-primary cursor-default"
                      : "text-muted-foreground hover:text-primary cursor-pointer"
                  }`}
                >
                  <ThumbsUp size={12} />
                  Helpful ({review.helpful})
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
