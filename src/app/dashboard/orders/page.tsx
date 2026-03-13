"use client";

import { Suspense } from "react";
import { Loader2, Search } from "lucide-react";
import { OrderTable } from "@/components/dashboard/order-table";
import { OrderCard } from "@/components/dashboard/order-card";
import { OrderSlideOver } from "@/components/dashboard/order-slide-over";
import { BulkActionBar } from "@/components/dashboard/bulk-action-bar";
import { BulkConfirmModal } from "@/components/dashboard/bulk-confirm-modal";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureGate } from "@/components/feature-gate";
import { useTranslation } from "@/i18n/provider";
import { useOrdersPage } from "@/hooks/use-orders-page";
import { OrdersHeader, OrdersActionButtons } from "./_components/orders-header";
import { DecisionPills, PipelineFilter } from "./_components/orders-filters";
import { OrdersSearch, MobileSearchBar } from "./_components/orders-search";
import { OrdersPagination } from "./_components/orders-pagination";

// ── Page ──

export default function OrdersPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
          <span className="ml-2 text-sm text-fog">{t("common.loading")}</span>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const { t } = useTranslation();
  const hook = useOrdersPage();

  const {
    currentSearch,
    selectedOrderId,
    orders,
    meta,
    counts,
    loading,
    perPage,
    selection,
    cursorMode,
    nextCursor,
    prevCursor,
    bulkAction,
    setBulkAction,
    bulkSubmitting,
    setFilter,
    goNextCursor,
    goPrevCursor,
    handlePerPageChange,
    handleRowClick,
    handleCloseSlideOver,
    handleBulkConfirm,
    handleDeliveryUpdate,
    fetchOrders,
  } = hook;

  const {
    selectedIds,
    isSelected,
    toggle,
    toggleAll,
    rangeSelect,
    clearSelection,
    selectAllState,
    selectionCount,
    isSelectionMode,
  } = selection;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <OrdersHeader
        counts={counts}
        refreshing={hook.refreshing}
        syncing={hook.syncing}
        csvLoading={hook.csvLoading}
        exportLoading={hook.exportLoading}
        csvInputRef={hook.csvInputRef}
        onRefresh={hook.handleRefresh}
        onCsvImport={hook.handleCsvImport}
        onExport={hook.handleExport}
        onOpenMobileSearch={hook.openMobileSearch}
      />

      {/* ── Mobile search bar (expanded) ── */}
      <MobileSearchBar
        open={hook.mobileSearchOpen}
        searchInput={hook.searchInput}
        mobileSearchRef={hook.mobileSearchRef}
        onSearchInputChange={hook.handleSearchInputChange}
        onClearSearch={hook.clearSearch}
        onClose={hook.closeMobileSearch}
      />

      {/* ── Filter bar: Pills + Pipeline + Search ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <DecisionPills
          currentDecision={hook.currentDecision}
          counts={counts}
          onFilterChange={setFilter}
        />

        {/* Pipeline + actions row — compact on mobile */}
        <div className="flex items-center gap-2">
          <PipelineFilter
            currentPipeline={hook.currentPipeline}
            onFilterChange={setFilter}
          />

          <OrdersSearch
            searchInput={hook.searchInput}
            searchFocused={hook.searchFocused}
            suggestions={hook.suggestions}
            recentSearches={hook.recentSearches}
            showDropdown={hook.showDropdown}
            searchInputRef={hook.searchInputRef}
            dropdownRef={hook.dropdownRef}
            onSearchInputChange={hook.handleSearchInputChange}
            onSearchFocus={hook.handleSearchFocus}
            onClearSearch={hook.clearSearch}
            onApplySearch={hook.applySearch}
            onSetSearchFocused={hook.setSearchFocused}
            onSetRecentSearches={hook.setRecentSearches}
          />

          <OrdersActionButtons
            refreshing={hook.refreshing}
            syncing={hook.syncing}
            csvLoading={hook.csvLoading}
            exportLoading={hook.exportLoading}
            csvInputRef={hook.csvInputRef}
            onRefresh={hook.handleRefresh}
            onCsvImport={hook.handleCsvImport}
            onExport={hook.handleExport}
          />
        </div>
      </div>

      {/* ── Orders Table (desktop) / Cards (mobile) ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
          <span className="ml-2 text-sm text-fog">{t("common.loading")}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-8 w-8 text-mist mx-auto mb-3" />
          <p className="text-fog font-medium">
            {t("orders.search.noResults")}
            {currentSearch && (
              <>
                {" "}
                {t("orders.search.noResultsFor", { query: currentSearch })}
              </>
            )}
          </p>
          {currentSearch && (
            <p className="text-sm text-mist mt-1">
              {t("orders.search.tryFewerKeywords")}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <OrderTable
                orders={orders}
                onRowClick={handleRowClick}
                searchQuery={currentSearch}
                selectedIds={selectedIds}
                onToggle={toggle}
                onToggleAll={toggleAll}
                onRangeSelect={rangeSelect}
                selectAllState={selectAllState}
                onDeliveryUpdate={handleDeliveryUpdate}
              />
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 lg:hidden">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={isSelectionMode ? () => toggle(order.id) : () => handleRowClick(order.id)}
                searchQuery={currentSearch}
                isSelected={isSelected(order.id)}
                isSelectionMode={isSelectionMode}
                onToggle={toggle}
                onLongPress={toggle}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Pagination ── */}
      <OrdersPagination
        meta={meta}
        perPage={perPage}
        cursorMode={cursorMode}
        nextCursor={nextCursor}
        prevCursor={prevCursor}
        onFilterChange={setFilter}
        onPerPageChange={handlePerPageChange}
        onNextCursor={goNextCursor}
        onPrevCursor={goPrevCursor}
      />

      {/* ── Bulk action bar — Starter+ ── */}
      {selectionCount > 0 && (
        <FeatureGate feature="bulk_actions" mode="lock">
          <BulkActionBar
            selectedCount={selectionCount}
            maxExceeded={selectionCount > 50}
            onForceShip={() => setBulkAction("SHIP")}
            onForceBlock={() => setBulkAction("BLOCK")}
            onClear={clearSelection}
          />
        </FeatureGate>
      )}

      {/* ── Bulk confirm modal ── */}
      <BulkConfirmModal
        open={bulkAction !== null}
        onOpenChange={(o) => { if (!o) setBulkAction(null); }}
        action={bulkAction ?? "SHIP"}
        selectedOrders={orders.filter((o) => selectedIds.has(o.id))}
        onConfirm={handleBulkConfirm}
        isSubmitting={bulkSubmitting}
      />

      {/* ── Slide-over ── */}
      <OrderSlideOver
        orderId={selectedOrderId ? parseInt(selectedOrderId, 10) : null}
        open={!!selectedOrderId}
        onClose={handleCloseSlideOver}
        onOverrideSuccess={fetchOrders}
      />
    </div>
  );
}
