/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 @ ℂ𝕣𝕖𝕒𝕥𝕖𝕕 𝕆𝕟: Sun Apr 20 2025
 */
import React, {ReactElement} from 'react';
import {FlatList, ListRenderItem} from 'react-native';
import {NotFoundView} from './not-found';

interface ListViewProps {
  devIds?: {id: string; title?: string};
  EmptyComponent?: ReactElement;
  ListHeaderComponent?: ReactElement;
  data: any;
  bounces?: boolean;
  contentContainerStyle?: any;
  style?: any;
  isRefreshable?: boolean;
  onEndReached?: () => void;
  onRefresh?: () => void;
  renderItem: ListRenderItem<any> | null | undefined;
}
const ListView: React.FC<ListViewProps> = ({
  isRefreshable = false,
  devIds,
  data,
  EmptyComponent,
  bounces = false,
  onEndReached,
  renderItem,
  onRefresh,
  ListHeaderComponent,
  contentContainerStyle,
  style,
  ...rest
}) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) {
      return;
    }
    setRefreshing(true);
    onRefresh();
    setRefreshing(false);
  };
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item, index) =>
        `${index}-${devIds?.title ?? ''} ${
          devIds?.id ? item[devIds.id] : index + ' ListView'
        }`
      }
      ListEmptyComponent={EmptyComponent ?? NotFoundView}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={contentContainerStyle}
      style={style}
      bounces={bounces}
      initialNumToRender={10}
      windowSize={10}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      refreshing={refreshing}
      onRefresh={isRefreshable ? handleRefresh : undefined}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      {...rest}
    />
  );
};

export default ListView;
