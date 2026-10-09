import { YStack, styled, Text, SizableStack } from "tamagui";

const StyledCard = styled(YStack, {
  name: "Card",
  backgroundColor: "$card",
  borderRadius: "$4",
  borderWidth: 1,
  borderColor: "$border",
  shadowColor: "$shadowColor",
  shadowRadius: "$2",
  shadowOpacity: 0.1,
  overflow: "hidden",
});

const StyledCardHeader = styled(YStack, {
  name: "CardHeader",
  padding: "$4",
  space: "$2",
});

const StyledCardTitle = styled(Text, {
  name: "CardTitle",
  fontSize: "$6",
  fontWeight: "600",
  color: "$cardForeground",
});

const StyledCardDescription = styled(Text, {
  name: "CardDescription",
  fontSize: "$2",
  color: "$mutedForeground",
});

const StyledCardContent = styled(YStack, {
  name: "CardContent",
  padding: "$4",
  paddingTop: 0,
});

const StyledCardFooter = styled(YStack, {
  name: "CardFooter",
  padding: "$4",
  paddingTop: 0,
  flexDirection: "row",
  alignItems: "center",
});

export const Card = StyledCard;
export const CardHeader = StyledCardHeader;
export const CardTitle = StyledCardTitle;
export const CardDescription = StyledCardDescription;
export const CardContent = StyledCardContent;
export const CardFooter = StyledCardFooter;
